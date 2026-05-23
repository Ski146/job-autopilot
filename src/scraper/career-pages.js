// ─── Company Career Page Scraper ───────────────────────
// PRIMARY scraper — navigates company career pages directly
// Uses Puppeteer for rendering JS-heavy career portals
// Each agent is assigned companies to scrape in parallel

const puppeteer = require("puppeteer");

/**
 * Scrape a single company career page for relevant job listings
 * @param {Object} company - { company, careerUrl, searchParams }
 * @param {Array} targetPositions - Array of position titles to search for
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeCompanyPage(company, targetPositions) {
    const jobs = [];
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        );

        // Stealth: override navigator.webdriver
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
        });

        // Search for each target position on this company's career page
        for (const position of targetPositions) {
            try {
                // Build search URL with position as search term
                const url = buildSearchUrl(company, position);
                console.log(`      [${company.company}] Searching: "${position}" → ${url}`);

                await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {
                    // Fallback to domcontentloaded if networkidle2 times out
                    return page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
                });

                // Wait for dynamic content
                await new Promise(r => setTimeout(r, 3000));

                // Scroll to load lazy-loaded content
                for (let i = 0; i < 3; i++) {
                    await page.evaluate(() => window.scrollBy(0, 600));
                    await new Promise(r => setTimeout(r, 800));
                }

                // Generic extraction — works across most career sites
                const listings = await page.evaluate((searchPosition, companyName) => {
                    const results = [];

                    // Strategy 1: Find links containing job-related text
                    const allLinks = Array.from(document.querySelectorAll("a"));
                    const positionWords = searchPosition.toLowerCase().split(" ");

                    for (const link of allLinks) {
                        const text = link.textContent.trim();
                        const href = link.href || "";

                        // Skip navigation links, very short text, etc.
                        if (text.length < 5 || text.length > 200) continue;
                        if (!href || href === "#" || href.includes("javascript:")) continue;

                        // Check if link text contains position keywords
                        const textLower = text.toLowerCase();
                        const matchCount = positionWords.filter(w =>
                            textLower.includes(w.toLowerCase())
                        ).length;

                        // Require at least half the keywords to match
                        if (matchCount >= Math.ceil(positionWords.length / 2)) {
                            // Look for nearby location/metadata
                            const parent = link.closest("li, tr, div[class*='job'], div[class*='card'], div[class*='result'], div[class*='position'], article");
                            let location = "";
                            if (parent) {
                                const locEl = parent.querySelector("[class*='location'], [class*='Location'], [data-field='location'], span:not(:first-child)");
                                if (locEl) location = locEl.textContent.trim();
                            }

                            results.push({
                                title: text,
                                url: href,
                                location: location,
                                company: companyName
                            });
                        }
                    }

                    // Strategy 2: Find structured job cards
                    const cardSelectors = [
                        "[class*='job-card']", "[class*='jobCard']", "[class*='job-listing']",
                        "[class*='JobCard']", "[class*='position-card']", "[class*='requisition']",
                        "[class*='search-result']", "[class*='SearchResult']",
                        "tr[class*='job']", "li[class*='job']",
                        "[data-job-id]", "[data-requisition]"
                    ];

                    for (const sel of cardSelectors) {
                        const cards = document.querySelectorAll(sel);
                        for (const card of cards) {
                            const titleEl = card.querySelector("a, h2, h3, h4, [class*='title'], [class*='Title']");
                            const locEl = card.querySelector("[class*='location'], [class*='Location']");

                            if (titleEl) {
                                const titleText = titleEl.textContent.trim();
                                const titleLower = titleText.toLowerCase();
                                const hasMatch = positionWords.some(w => titleLower.includes(w.toLowerCase()));

                                if (hasMatch && titleText.length > 3 && titleText.length < 200) {
                                    const linkEl = card.querySelector("a[href]") || titleEl.closest("a");
                                    results.push({
                                        title: titleText,
                                        url: linkEl ? linkEl.href : "",
                                        location: locEl ? locEl.textContent.trim() : "",
                                        company: companyName
                                    });
                                }
                            }
                        }
                    }

                    // Deduplicate by title
                    const seen = new Set();
                    return results.filter(r => {
                        const key = r.title.toLowerCase();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                }, position, company.company);

                // Fetch descriptions for found listings
                for (const listing of listings.slice(0, 5)) {
                    let description = "";

                    if (listing.url && listing.url.startsWith("http")) {
                        try {
                            await page.goto(listing.url, { waitUntil: "networkidle2", timeout: 20000 }).catch(() =>
                                page.goto(listing.url, { waitUntil: "domcontentloaded", timeout: 10000 })
                            );
                            await new Promise(r => setTimeout(r, 2000));

                            description = await page.evaluate(() => {
                                // Try common JD container selectors
                                const selectors = [
                                    "[class*='job-description']", "[class*='jobDescription']",
                                    "[class*='JobDescription']", "[class*='description']",
                                    "[class*='posting-requirements']", "[class*='requisition-description']",
                                    "[id*='job-description']", "[id*='jobDescription']",
                                    "article", ".content-wrapper", "main"
                                ];

                                for (const sel of selectors) {
                                    const el = document.querySelector(sel);
                                    if (el && el.textContent.trim().length > 100) {
                                        return el.textContent.trim().substring(0, 5000);
                                    }
                                }

                                // Fallback: grab the body text
                                return document.body.innerText.substring(0, 3000);
                            });
                        } catch {}
                    }

                    jobs.push({
                        title: listing.title,
                        company: company.company,
                        location: listing.location || "",
                        url: listing.url || company.careerUrl,
                        description: description || "Description not available — see job URL",
                        postedDate: new Date().toISOString().split("T")[0],
                        source: "career-page",
                        searchedPosition: position
                    });
                }

            } catch (err) {
                console.error(`      [${company.company}] Error searching "${position}": ${err.message}`);
            }
        }

    } catch (err) {
        console.error(`    [Career Pages] Error for ${company.company}: ${err.message}`);
        throw err;
    } finally {
        if (browser) await browser.close();
    }

    return jobs;
}

/**
 * Build a search URL for a company career page
 */
function buildSearchUrl(company, position) {
    const url = new URL(company.careerUrl);

    if (company.searchParams) {
        for (const [key, value] of Object.entries(company.searchParams)) {
            // If the value is empty, fill with the position
            url.searchParams.set(key, value || position);
        }
    }

    return url.toString();
}

/**
 * Scrape all configured company career pages
 * @param {Object} config - { titles, location }
 * @param {Object} sourceConfig - customPages config from job-sources.js
 * @returns {Promise<Array>} - All jobs found across all companies
 */
async function scrapeAllCareerPages(config, sourceConfig) {
    const allJobs = [];
    const errors = [];
    const targetPositions = config.titles || ["Data Engineer"];

    console.log(`    [Career Pages] Scraping ${sourceConfig.companies.length} companies for ${targetPositions.length} positions...`);

    // Process companies in batches of 3 to avoid resource issues
    const batchSize = 3;
    for (let i = 0; i < sourceConfig.companies.length; i += batchSize) {
        const batch = sourceConfig.companies.slice(i, i + batchSize);

        const batchPromises = batch.map(async (company) => {
            try {
                const jobs = await scrapeCompanyPage(company, targetPositions);
                console.log(`      [${company.company}] Found ${jobs.length} matching jobs`);
                allJobs.push(...jobs);
            } catch (err) {
                errors.push({ company: company.company, error: err.message });
            }
        });

        await Promise.all(batchPromises);

        // Small delay between batches
        if (i + batchSize < sourceConfig.companies.length) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log(`    [Career Pages] Total: ${allJobs.length} jobs from ${sourceConfig.companies.length - errors.length} companies (${errors.length} errors)`);

    return { jobs: allJobs, errors };
}

module.exports = { scrapeCompanyPage, scrapeAllCareerPages };
