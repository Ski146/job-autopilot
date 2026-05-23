// ─── Indeed Job Scraper ────────────────────────────────
// Scrapes job listings from Indeed using Puppeteer

const puppeteer = require("puppeteer");

/**
 * Scrape Indeed for job listings
 * @param {Object} config - {title, location, keywords}
 * @param {Object} sourceConfig - Indeed-specific config from job-sources.js
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeIndeed(config, sourceConfig) {
    const jobs = [];
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
        
        // Build Indeed search URL
        const params = new URLSearchParams({
            q: config.title || "Software Engineer",
            l: config.location || "Remote",
            fromage: sourceConfig.datePosted || "1",  // last 24 hours
            sort: "date"
        });

        if (sourceConfig.jobType) params.append("jt", sourceConfig.jobType);

        const url = `${sourceConfig.baseUrl}?${params.toString()}`;
        console.log(`    [Indeed] Navigating to: ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for job cards to load
        await page.waitForSelector(".job_seen_beacon, .jobsearch-ResultsList, .resultContent", { timeout: 10000 }).catch(() => {});

        // Extract job listings
        const listings = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll(".job_seen_beacon, .resultContent, [data-jk]");

            for (const card of cards) {
                try {
                    const titleEl = card.querySelector("h2 a, .jobTitle a, [data-jk] a");
                    const companyEl = card.querySelector("[data-testid='company-name'], .companyName, .company");
                    const locationEl = card.querySelector("[data-testid='text-location'], .companyLocation, .location");
                    const snippetEl = card.querySelector(".job-snippet, .summary, [class*='snippet']");

                    if (titleEl) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            url: titleEl.href || "",
                            company: companyEl ? companyEl.textContent.trim() : "Unknown",
                            location: locationEl ? locationEl.textContent.trim() : "",
                            snippet: snippetEl ? snippetEl.textContent.trim() : "",
                        });
                    }
                } catch {}
            }
            return results;
        });

        // Fetch full job descriptions for each listing (limit to avoid rate limiting)
        const maxFetch = Math.min(listings.length, sourceConfig.maxResults || 25);
        
        for (let i = 0; i < maxFetch; i++) {
            const listing = listings[i];
            try {
                if (listing.url && listing.url.startsWith("http")) {
                    await page.goto(listing.url, { waitUntil: "networkidle2", timeout: 20000 });
                    
                    const description = await page.evaluate(() => {
                        const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText, [id*='jobDescription']");
                        return descEl ? descEl.textContent.trim() : "";
                    });

                    listing.description = description || listing.snippet;
                } else {
                    listing.description = listing.snippet;
                }
            } catch {
                listing.description = listing.snippet;
            }

            jobs.push({
                title: listing.title,
                company: listing.company,
                location: listing.location,
                url: listing.url,
                description: listing.description,
                postedDate: new Date().toISOString().split("T")[0],
                source: "indeed"
            });
        }

    } catch (err) {
        console.error(`    [Indeed] Scrape error: ${err.message}`);
        throw err;
    } finally {
        if (browser) await browser.close();
    }

    return jobs;
}

module.exports = scrapeIndeed;
