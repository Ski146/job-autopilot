// ─── Google Jobs Scraper ───────────────────────────────
// Scrapes job listings from Google Jobs search results

const puppeteer = require("puppeteer");

/**
 * Scrape Google Jobs search results
 * @param {Object} config - {title, location, keywords}
 * @param {Object} sourceConfig - Google Jobs specific config
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeGoogleJobs(config, sourceConfig) {
    const jobs = [];
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

        // Google Jobs search query
        const query = encodeURIComponent(`${config.title || "Software Engineer"} jobs ${config.location || "Remote"}`);
        const url = `https://www.google.com/search?q=${query}&ibp=htl;jobs&htichips=date_posted:today`;
        
        console.log(`    [Google Jobs] Navigating to: ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for Google Jobs panel to load
        await page.waitForSelector("[jsname], .iFjolb, [data-hveid]", { timeout: 10000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));

        // Extract job listings from Google Jobs panel
        const listings = await page.evaluate(() => {
            const results = [];
            
            // Google Jobs uses various selectors — try multiple
            const cards = document.querySelectorAll(".iFjolb, .PwjeAc, li[data-hveid], [jsaction*='click']");

            for (const card of cards) {
                try {
                    const titleEl = card.querySelector(".BjJfJf, .sH3zle, [role='heading'], h2, h3");
                    const companyEl = card.querySelector(".vNEEBe, .nJlQNd, .company");
                    const locationEl = card.querySelector(".Qk80Jf, .location, [class*='location']");
                    
                    if (titleEl && titleEl.textContent.trim()) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            company: companyEl ? companyEl.textContent.trim() : "Unknown",
                            location: locationEl ? locationEl.textContent.trim() : "",
                        });
                    }
                } catch {}
            }

            return results;
        });

        // For Google Jobs, get descriptions by clicking each card
        const maxFetch = Math.min(listings.length, sourceConfig.maxResults || 20);

        for (let i = 0; i < maxFetch; i++) {
            const listing = listings[i];

            try {
                // Try to click the card to load its description
                const cards = await page.$$(".iFjolb, .PwjeAc, li[data-hveid]");
                if (cards[i]) {
                    await cards[i].click();
                    await new Promise(r => setTimeout(r, 1500));

                    const description = await page.evaluate(() => {
                        const descEl = document.querySelector(".YgLbBe, .HBvzbc, [class*='description'], .job-description");
                        return descEl ? descEl.textContent.trim() : "";
                    });

                    listing.description = description;

                    // Try to get the apply URL
                    const applyUrl = await page.evaluate(() => {
                        const applyBtn = document.querySelector("a[href*='apply'], a.pMhGee, a[jsaction*='apply']");
                        return applyBtn ? applyBtn.href : "";
                    });
                    listing.url = applyUrl;
                }
            } catch {
                listing.description = "";
                listing.url = "";
            }

            jobs.push({
                title: listing.title,
                company: listing.company,
                location: listing.location,
                url: listing.url || `https://www.google.com/search?q=${encodeURIComponent(listing.title + " " + listing.company + " apply")}`,
                description: listing.description || "No description available",
                postedDate: new Date().toISOString().split("T")[0],
                source: "google-jobs"
            });
        }

    } catch (err) {
        console.error(`    [Google Jobs] Scrape error: ${err.message}`);
        throw err;
    } finally {
        if (browser) await browser.close();
    }

    return jobs;
}

module.exports = scrapeGoogleJobs;
