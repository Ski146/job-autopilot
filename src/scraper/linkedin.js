// ─── LinkedIn Job Scraper ──────────────────────────────
// Scrapes public LinkedIn job listings (no login required)

const puppeteer = require("puppeteer");

/**
 * Scrape LinkedIn Jobs (public, no auth)
 * @param {Object} config - {title, location, keywords}
 * @param {Object} sourceConfig - LinkedIn-specific config
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeLinkedIn(config, sourceConfig) {
    const jobs = [];
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

        // LinkedIn public job search URL
        const params = new URLSearchParams({
            keywords: config.title || "Software Engineer",
            location: config.location || "Remote",
            f_TPR: sourceConfig.datePosted || "r86400",  // past 24 hours
            sortBy: "DD"  // sort by date
        });

        if (sourceConfig.jobType) params.append("f_JT", sourceConfig.jobType);
        if (sourceConfig.experienceLevel) params.append("f_E", sourceConfig.experienceLevel);

        const url = `${sourceConfig.baseUrl}?${params.toString()}`;
        console.log(`    [LinkedIn] Navigating to: ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for job cards
        await page.waitForSelector(".jobs-search__results-list, .base-card, .job-search-card", { timeout: 10000 }).catch(() => {});

        // Scroll to load more results
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 800));
            await new Promise(r => setTimeout(r, 1000));
        }

        // Extract job listings
        const listings = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll(".base-card, .job-search-card, [data-entity-urn]");

            for (const card of cards) {
                try {
                    const titleEl = card.querySelector(".base-search-card__title, .job-search-card__title, h3");
                    const companyEl = card.querySelector(".base-search-card__subtitle, .job-search-card__company-name, h4");
                    const locationEl = card.querySelector(".job-search-card__location, .base-search-card__metadata span");
                    const linkEl = card.querySelector("a.base-card__full-link, a[href*='/jobs/view']");
                    const timeEl = card.querySelector("time, .job-search-card__listdate");

                    if (titleEl) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            company: companyEl ? companyEl.textContent.trim() : "Unknown",
                            location: locationEl ? locationEl.textContent.trim() : "",
                            url: linkEl ? linkEl.href : "",
                            postedDate: timeEl ? timeEl.getAttribute("datetime") || "" : ""
                        });
                    }
                } catch {}
            }
            return results;
        });

        // Fetch full descriptions
        const maxFetch = Math.min(listings.length, sourceConfig.maxResults || 25);

        for (let i = 0; i < maxFetch; i++) {
            const listing = listings[i];
            try {
                if (listing.url) {
                    await page.goto(listing.url, { waitUntil: "networkidle2", timeout: 20000 });

                    const description = await page.evaluate(() => {
                        const descEl = document.querySelector(".description__text, .show-more-less-html__markup, .jobs-description__content");
                        return descEl ? descEl.textContent.trim() : "";
                    });

                    listing.description = description;
                }
            } catch {
                listing.description = "";
            }

            jobs.push({
                title: listing.title,
                company: listing.company,
                location: listing.location,
                url: listing.url,
                description: listing.description || "No description available",
                postedDate: listing.postedDate || new Date().toISOString().split("T")[0],
                source: "linkedin"
            });
        }

    } catch (err) {
        console.error(`    [LinkedIn] Scrape error: ${err.message}`);
        throw err;
    } finally {
        if (browser) await browser.close();
    }

    return jobs;
}

module.exports = scrapeLinkedIn;
