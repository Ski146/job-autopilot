// ─── Job Scraper Orchestrator ──────────────────────────
// Coordinates scraping from company career pages (primary)
// and optional job boards (secondary)

const { deduplicateJobs } = require("../utils/dedup");
const { timestamp } = require("../utils/date-utils");
const { scrapeAllCareerPages } = require("./career-pages");

/**
 * Scrape all configured job sources and return deduplicated results
 * @param {Object} config - Search configuration
 * @param {string[]} config.titles - Job titles to search
 * @param {string} config.location - Location filter
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - { jobs, errors, stats }
 */
async function scrapeAllSources(config, onProgress = null) {
    const log = (msg) => {
        const line = `  [Scraper] ${timestamp()} — ${msg}`;
        console.log(line);
        if (onProgress) onProgress("scraper", "log", msg);
    };

    log(`Starting job scrape for ${config.titles.length} positions`);
    log(`Positions: ${config.titles.join(", ")}`);

    const JOB_SOURCES = require("../../config/job-sources");
    const allJobs = [];
    const allErrors = [];

    // ─── PRIMARY: Company Career Pages ─────────────────
    if (JOB_SOURCES.customPages.enabled) {
        log(`Scraping ${JOB_SOURCES.customPages.companies.length} company career pages...`);
        try {
            const { jobs, errors } = await scrapeAllCareerPages(config, JOB_SOURCES.customPages);
            allJobs.push(...jobs);
            allErrors.push(...errors.map(e => ({ source: `career-page:${e.company}`, error: e.error })));
            log(`Career pages: ${jobs.length} jobs found`);
        } catch (err) {
            log(`Career pages: CRITICAL ERROR — ${err.message}`);
            allErrors.push({ source: "career-pages", error: err.message });
        }
    }

    // ─── SECONDARY: Job Boards (if enabled) ────────────
    if (JOB_SOURCES.indeed.enabled) {
        try {
            const scrapeIndeed = require("./indeed");
            const jobs = await scrapeIndeed({ title: config.titles[0], location: config.location }, JOB_SOURCES.indeed);
            allJobs.push(...jobs);
            log(`Indeed: ${jobs.length} jobs found`);
        } catch (err) {
            log(`Indeed: ERROR — ${err.message}`);
            allErrors.push({ source: "indeed", error: err.message });
        }
    }

    if (JOB_SOURCES.linkedin.enabled) {
        try {
            const scrapeLinkedIn = require("./linkedin");
            const jobs = await scrapeLinkedIn({ title: config.titles[0], location: config.location }, JOB_SOURCES.linkedin);
            allJobs.push(...jobs);
            log(`LinkedIn: ${jobs.length} jobs found`);
        } catch (err) {
            log(`LinkedIn: ERROR — ${err.message}`);
            allErrors.push({ source: "linkedin", error: err.message });
        }
    }

    if (JOB_SOURCES.googleJobs.enabled) {
        try {
            const scrapeGoogleJobs = require("./google-jobs");
            const jobs = await scrapeGoogleJobs({ title: config.titles[0], location: config.location }, JOB_SOURCES.googleJobs);
            allJobs.push(...jobs);
            log(`Google Jobs: ${jobs.length} jobs found`);
        } catch (err) {
            log(`Google Jobs: ERROR — ${err.message}`);
            allErrors.push({ source: "google-jobs", error: err.message });
        }
    }

    // ─── Filter & Deduplicate ──────────────────────────
    const blacklist = JOB_SOURCES.blacklist || {};
    let filtered = allJobs;

    if (blacklist.companies && blacklist.companies.length > 0) {
        const blocked = blacklist.companies.map(c => c.toLowerCase());
        filtered = filtered.filter(j =>
            !blocked.includes((j.company || "").toLowerCase())
        );
    }

    if (blacklist.keywords && blacklist.keywords.length > 0) {
        filtered = filtered.filter(j => {
            const text = `${j.title} ${j.description}`.toLowerCase();
            return !blacklist.keywords.some(kw => text.includes(kw.toLowerCase()));
        });
    }

    const unique = deduplicateJobs(filtered);
    const maxApps = parseInt(process.env.MAX_APPLICATIONS_PER_RUN || "30");
    const limited = unique.slice(0, maxApps);

    log(`Pipeline: ${allJobs.length} raw → ${filtered.length} filtered → ${unique.length} unique → ${limited.length} to process`);

    return {
        jobs: limited,
        errors: allErrors,
        stats: {
            raw: allJobs.length,
            filtered: filtered.length,
            unique: unique.length,
            limited: limited.length,
            errorCount: allErrors.length
        }
    };
}

module.exports = { scrapeAllSources };
