// ─── Job Autopilot — Main Entry Point ──────────────────
// Orchestrates the full pipeline:
// 1. Load config & resume
// 2. Scrape jobs from career pages
// 3. Process each job through 6-agent pipeline
// 4. Log results to CSV
// 5. Start dashboard + scheduler

require("dotenv").config();

const path = require("path");
const { timestamp } = require("./utils/date-utils");
const { findResume, parseResume } = require("./resume/parser");
const { scrapeAllSources } = require("./scraper/index");
const { processAllJobs } = require("./agents/index");
const { logToCSV, logDailySummary } = require("./logger/csv-logger");
const { generateResumePDF } = require("./resume/generator");
const { createRunLog } = require("./logger/run-logger");
const { markJobAsSeen } = require("./utils/dedup");
const { startScheduler } = require("./scheduler");

// ─── Banner ────────────────────────────────────────────
function printBanner() {
    console.log("");
    console.log("  ╔══════════════════════════════════════════════════════╗");
    console.log("  ║                                                      ║");
    console.log("  ║   🚀  JOB AUTOPILOT — LLM Council                   ║");
    console.log("  ║   Automated Job Application System                   ║");
    console.log("  ║   6 Models · Career Pages · Resume Tailoring         ║");
    console.log("  ║                                                      ║");
    console.log("  ╚══════════════════════════════════════════════════════╝");
    console.log("");
}

// ─── Run the full pipeline ─────────────────────────────
async function runPipeline() {
    const runLog = createRunLog();
    console.log(`\n  ══════════════════════════════════════════════════════`);
    console.log(`  🔄 Pipeline started at ${timestamp()}`);
    console.log(`  Run ID: ${runLog.id}`);
    console.log(`  ══════════════════════════════════════════════════════\n`);

    try {
        // ─── 1. Load Resume ─────────────────────────────
        console.log("  [1/4] Loading resume...");
        const resumePath = findResume();
        if (!resumePath) {
            const msg = "No resume PDF found! Place your resume in the /resume folder.";
            console.error(`  ❌ ${msg}`);
            runLog.fail(msg);
            return { success: false, error: msg };
        }

        const { raw: resumeText, sections: resumeSections, pages } = await parseResume(resumePath);
        console.log(`  ✓ Resume loaded: ${path.basename(resumePath)} (${pages} page${pages > 1 ? "s" : ""})`);
        console.log(`  ✓ Sections found: ${Object.keys(resumeSections).join(", ")}`);

        // ─── 2. Build Config ────────────────────────────
        const titles = (process.env.JOB_TITLES || "Data Engineer")
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        const config = {
            titles,
            location: process.env.JOB_LOCATION || "Remote",
        };

        runLog.setConfig(config);
        console.log(`  ✓ Target positions: ${titles.join(", ")}`);
        console.log(`  ✓ Location: ${config.location}\n`);

        // ─── 3. Scrape Jobs ─────────────────────────────
        console.log("  [2/4] Scraping company career pages...");
        const { jobs, errors: scrapeErrors, stats } = await scrapeAllSources(config);

        runLog.setScrapeStats(stats);
        console.log(`  ✓ Found ${jobs.length} jobs to process\n`);

        if (jobs.length === 0) {
            const msg = "No new jobs found in this run.";
            console.log(`  ℹ ${msg}`);
            runLog.complete();
            return { success: true, message: msg, stats };
        }

        // ─── 4. Process Jobs ────────────────────────────
        console.log("  [3/4] Processing jobs through 6-agent pipeline...");
        const results = await processAllJobs(jobs, resumeText, resumeSections);

        // ─── 5. Log & Generate PDFs ─────────────────────
        console.log("\n  [4/4] Logging results and generating tailored resumes...");

        for (const result of results) {
            // Generate PDF for successful results
            if (result.status === "logged" && result.tailoredResume) {
                try {
                    const pdfPath = await generateResumePDF(result.tailoredResume, {
                        company: result.job.company,
                        position: result.job.title,
                        agentId: result.selectedAgentId || "synthesizer",
                        date: new Date().toISOString().split("T")[0]
                    });
                    result.resumePdfPath = pdfPath;
                    console.log(`    ✓ Resume PDF: ${path.basename(pdfPath)}`);
                } catch (err) {
                    console.error(`    ⚠ PDF generation failed: ${err.message}`);
                }
            }

            // Log to per-model CSV
            try {
                const csvPath = logToCSV(result);
                console.log(`    ✓ CSV logged: ${path.basename(csvPath)}`);
            } catch (err) {
                console.error(`    ⚠ CSV logging failed: ${err.message}`);
            }

            // Mark job as seen
            if (result.job) {
                markJobAsSeen(result.job, result.status);
            }

            // Add to run log
            runLog.addResult(result);
        }

        // Daily summary CSV
        const summaryPath = logDailySummary(results);
        console.log(`    ✓ Daily summary: ${path.basename(summaryPath)}`);

        // Complete the run
        const summary = runLog.complete();

        console.log(`\n  ══════════════════════════════════════════════════════`);
        console.log(`  ✅ Pipeline complete at ${timestamp()}`);
        console.log(`  📊 Results: ${summary.succeeded} succeeded, ${summary.failed} failed`);
        console.log(`  ⏱  Total time: ${summary.totalDurationMin} minutes`);
        if (Object.keys(summary.modelSelections).length > 0) {
            console.log(`  🏆 Model selections: ${JSON.stringify(summary.modelSelections)}`);
        }
        console.log(`  ══════════════════════════════════════════════════════\n`);

        return { success: true, summary, results };

    } catch (err) {
        console.error(`\n  ❌ Pipeline failed: ${err.message}`);
        runLog.fail(err.message);
        return { success: false, error: err.message };
    }
}

// ─── Main ──────────────────────────────────────────────
async function main() {
    printBanner();

    // Check for --run-now flag
    const runNow = process.argv.includes("--run-now");

    if (runNow) {
        console.log("  🏃 Manual run triggered (--run-now)\n");
        await runPipeline();
    } else {
        // Start the scheduler
        const cron = process.env.SCHEDULE_CRON || "0 10 * * *";
        console.log(`  ⏰ Scheduler active: "${cron}"`);
        console.log(`  📊 Dashboard: http://localhost:${process.env.DASHBOARD_PORT || 4000}`);
        console.log(`  💡 Use --run-now to trigger immediately\n`);

        startScheduler(cron, runPipeline);

        // Also start the dashboard server
        try {
            require("../dashboard/server");
        } catch (err) {
            console.error(`  ⚠ Dashboard failed to start: ${err.message}`);
        }
    }
}

// Export for use by dashboard and scheduler
module.exports = { runPipeline };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
