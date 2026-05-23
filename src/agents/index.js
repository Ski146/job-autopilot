// ─── Agent Pipeline Orchestrator ───────────────────────
// Coordinates all 6 LLM models through the job application pipeline
// Step 1: All agents analyze JD in parallel
// Step 2: All agents tailor resume in parallel
// Step 3: Synthesizer picks the best tailored version
// Step 4: Log everything

const { AGENTS, SYNTHESIZER } = require("../../config/agents");
const { callAllAgents, callModelWithRetry } = require("./openrouter");
const { analyzeJobDescription } = require("./job-analyzer");
const { tailorResume } = require("./resume-tailor");
const { prepareApplicationData } = require("./application-prep");
const { timestamp } = require("../utils/date-utils");

/**
 * Process a single job through the full agent pipeline
 * @param {Object} job - Job object { title, company, description, url, ... }
 * @param {string} resumeText - Original resume raw text
 * @param {Object} resumeSections - Parsed resume sections
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Pipeline result
 */
async function processJob(job, resumeText, resumeSections, onProgress = null) {
    const log = (msg) => {
        const line = `    [Pipeline] ${timestamp()} — ${msg}`;
        console.log(line);
        if (onProgress) onProgress("pipeline", "log", msg);
    };

    log(`Processing: "${job.title}" at ${job.company}`);
    const startTime = Date.now();

    // ─── Step 1: Analyze Job Description ──────────────
    log("Step 1/3: Analyzing job description with all 6 agents...");
    const analysis = await analyzeJobDescription(job, onProgress);

    if (!analysis || analysis.error) {
        log(`Analysis failed: ${analysis?.error || "No results"}`);
        return {
            job,
            status: "failed",
            error: analysis?.error || "JD analysis failed",
            duration: Date.now() - startTime
        };
    }

    // ─── Step 2: Tailor Resume ────────────────────────
    log("Step 2/3: Tailoring resume with all 6 agents...");
    const tailorResult = await tailorResume(job, resumeText, resumeSections, analysis, onProgress);

    if (!tailorResult || tailorResult.error) {
        log(`Resume tailoring failed: ${tailorResult?.error || "No results"}`);
        return {
            job,
            status: "failed",
            error: tailorResult?.error || "Resume tailoring failed",
            analysis,
            duration: Date.now() - startTime
        };
    }

    // ─── Step 3: Prepare Application Data ─────────────
    log("Step 3/3: Preparing application data...");
    const appData = await prepareApplicationData(job, tailorResult.bestResume, analysis, onProgress);

    const duration = Date.now() - startTime;
    log(`✓ Complete in ${(duration / 1000).toFixed(1)}s — Best resume by: ${tailorResult.selectedAgent}`);

    return {
        job,
        status: "logged",
        analysis,
        tailoredResume: tailorResult.bestResume,
        selectedAgent: tailorResult.selectedAgent,
        allVersions: tailorResult.allVersions,
        applicationData: appData,
        duration,
        timestamp: new Date().toISOString()
    };
}

/**
 * Process multiple jobs through the pipeline sequentially
 * (Sequential to avoid overwhelming free API tier)
 * @param {Array} jobs - Array of job objects
 * @param {string} resumeText - Original resume text
 * @param {Object} resumeSections - Parsed resume sections
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} - Array of pipeline results
 */
async function processAllJobs(jobs, resumeText, resumeSections, onProgress = null) {
    const results = [];

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        console.log(`\n  [${ i + 1}/${jobs.length}] ────────────────────────────────`);

        try {
            const result = await processJob(job, resumeText, resumeSections, onProgress);
            results.push(result);
        } catch (err) {
            console.error(`    [Pipeline] Error processing "${job.title}" at ${job.company}: ${err.message}`);
            results.push({
                job,
                status: "failed",
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }

        // Delay between jobs to respect rate limits on free tier
        if (i < jobs.length - 1) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    return results;
}

module.exports = { processJob, processAllJobs };
