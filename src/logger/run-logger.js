// ─── Run Logger ────────────────────────────────────────
// Logs full run metadata — start time, end time, results summary

const fs = require("fs");
const path = require("path");
const { timestamp, fileDate } = require("../utils/date-utils");

const RUNS_DIR = path.join(__dirname, "../../output/runs");

/**
 * Create a new run log
 * @returns {Object} - Run object with log methods
 */
function createRunLog() {
    if (!fs.existsSync(RUNS_DIR)) fs.mkdirSync(RUNS_DIR, { recursive: true });

    const runId = `run_${fileDate()}_${Date.now()}`;
    const runFile = path.join(RUNS_DIR, `${runId}.json`);

    const run = {
        id: runId,
        startTime: new Date().toISOString(),
        endTime: null,
        status: "running",
        config: {},
        scrapeStats: {},
        results: [],
        errors: [],
        summary: {}
    };

    const save = () => {
        fs.writeFileSync(runFile, JSON.stringify(run, null, 2));
    };

    save();

    return {
        id: runId,

        setConfig(config) {
            run.config = config;
            save();
        },

        setScrapeStats(stats) {
            run.scrapeStats = stats;
            save();
        },

        addResult(result) {
            // Store a lightweight version (no full JD/resume text)
            run.results.push({
                company: result.job?.company || "",
                position: result.job?.title || "",
                location: result.job?.location || "",
                url: result.job?.url || "",
                status: result.status || "unknown",
                selectedAgent: result.selectedAgent || "",
                duration: result.duration || 0,
                timestamp: result.timestamp || new Date().toISOString(),
                resumePdfPath: result.resumePdfPath || "",
                error: result.error || null
            });
            save();
        },

        addError(error) {
            run.errors.push({
                message: typeof error === "string" ? error : error.message,
                timestamp: new Date().toISOString()
            });
            save();
        },

        complete() {
            run.endTime = new Date().toISOString();
            run.status = "completed";

            const succeeded = run.results.filter(r => r.status === "logged").length;
            const failed = run.results.filter(r => r.status === "failed").length;
            const totalDuration = run.results.reduce((sum, r) => sum + (r.duration || 0), 0);

            run.summary = {
                totalJobs: run.results.length,
                succeeded,
                failed,
                totalDurationMs: totalDuration,
                totalDurationMin: (totalDuration / 60000).toFixed(1),
                averageDurationSec: run.results.length > 0 
                    ? (totalDuration / run.results.length / 1000).toFixed(1) 
                    : 0,
                // Count which models were selected most
                modelSelections: countModelSelections(run.results)
            };

            save();
            return run.summary;
        },

        fail(error) {
            run.endTime = new Date().toISOString();
            run.status = "failed";
            run.errors.push({ message: error, timestamp: new Date().toISOString() });
            save();
        },

        getRun() {
            return run;
        }
    };
}

/**
 * Count how many times each model was selected as best
 */
function countModelSelections(results) {
    const counts = {};
    for (const r of results) {
        if (r.selectedAgent && r.status === "logged") {
            counts[r.selectedAgent] = (counts[r.selectedAgent] || 0) + 1;
        }
    }
    return counts;
}

/**
 * Get all past runs
 */
function getAllRuns() {
    if (!fs.existsSync(RUNS_DIR)) return [];

    return fs.readdirSync(RUNS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), "utf-8"));
                return data;
            } catch {
                return null;
            }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

/**
 * Get today's runs
 */
function getTodayRuns() {
    const today = fileDate();
    return getAllRuns().filter(r => r.startTime && r.startTime.startsWith(today));
}

module.exports = { createRunLog, getAllRuns, getTodayRuns };
