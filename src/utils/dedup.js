// ─── Job Deduplication ─────────────────────────────────
// Prevents applying to the same job twice across sources

const fs = require("fs");
const path = require("path");

const SEEN_JOBS_FILE = path.join(__dirname, "../../output/seen-jobs.json");

/**
 * Load previously seen jobs
 */
function loadSeenJobs() {
    try {
        if (fs.existsSync(SEEN_JOBS_FILE)) {
            return JSON.parse(fs.readFileSync(SEEN_JOBS_FILE, "utf-8"));
        }
    } catch {}
    return {};
}

/**
 * Save seen jobs to disk
 */
function saveSeenJobs(seen) {
    const dir = path.dirname(SEEN_JOBS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(seen, null, 2));
}

/**
 * Generate a unique key for a job
 */
function jobKey(job) {
    const title = (job.title || "").toLowerCase().trim();
    const company = (job.company || "").toLowerCase().trim();
    return `${company}::${title}`;
}

/**
 * Deduplicate jobs — removes already-seen and duplicate entries
 * @param {Array} jobs - Array of job objects
 * @returns {Array} - Filtered array of new, unique jobs
 */
function deduplicateJobs(jobs) {
    const seen = loadSeenJobs();
    const result = [];
    const sessionKeys = new Set();

    for (const job of jobs) {
        const key = jobKey(job);
        
        // Skip if already applied or seen in this session
        if (seen[key] || sessionKeys.has(key)) continue;

        sessionKeys.add(key);
        result.push(job);
    }

    return result;
}

/**
 * Mark a job as seen/applied
 */
function markJobAsSeen(job, status = "applied") {
    const seen = loadSeenJobs();
    seen[jobKey(job)] = {
        title: job.title,
        company: job.company,
        date: new Date().toISOString(),
        status
    };
    saveSeenJobs(seen);
}

module.exports = { deduplicateJobs, markJobAsSeen, jobKey };
