// ─── Manager Dashboard Server ──────────────────────────
// Premium dark-themed dashboard for monitoring job applications

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const path = require("path");
const { getAllRuns, getTodayRuns } = require("../src/logger/run-logger");
const { getAllLogs, parseCSV } = require("../src/logger/csv-logger");
const { fileDate } = require("../src/utils/date-utils");

const PORT = process.env.DASHBOARD_PORT || 4000;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ─── API: Today's Stats ───────────────────────────────
app.get("/api/stats/today", (req, res) => {
    const todayRuns = getTodayRuns();
    
    let totalApplications = 0;
    let succeeded = 0;
    let failed = 0;
    const modelCounts = {};

    for (const run of todayRuns) {
        for (const result of (run.results || [])) {
            totalApplications++;
            if (result.status === "logged") succeeded++;
            else if (result.status === "failed") failed++;

            if (result.selectedAgent) {
                modelCounts[result.selectedAgent] = (modelCounts[result.selectedAgent] || 0) + 1;
            }
        }
    }

    res.json({
        date: fileDate(),
        totalApplications,
        succeeded,
        failed,
        successRate: totalApplications > 0 ? ((succeeded / totalApplications) * 100).toFixed(1) : 0,
        runsToday: todayRuns.length,
        lastRun: todayRuns[0]?.startTime || null,
        nextRun: getNextScheduledRun(),
        modelSelections: modelCounts
    });
});

// ─── API: Historical Stats ────────────────────────────
app.get("/api/stats/history", (req, res) => {
    const allRuns = getAllRuns();
    const dailyStats = {};

    for (const run of allRuns) {
        const date = run.startTime ? run.startTime.split("T")[0] : "unknown";
        if (!dailyStats[date]) {
            dailyStats[date] = { date, total: 0, succeeded: 0, failed: 0, runs: 0 };
        }
        dailyStats[date].runs++;
        for (const result of (run.results || [])) {
            dailyStats[date].total++;
            if (result.status === "logged") dailyStats[date].succeeded++;
            else dailyStats[date].failed++;
        }
    }

    const stats = Object.values(dailyStats).sort((a, b) => b.date.localeCompare(a.date));
    res.json(stats.slice(0, 30)); // Last 30 days
});

// ─── API: All Applications ────────────────────────────
app.get("/api/applications", (req, res) => {
    const allRuns = getAllRuns();
    const applications = [];

    for (const run of allRuns) {
        for (const result of (run.results || [])) {
            applications.push({
                ...result,
                runId: run.id,
                runDate: run.startTime
            });
        }
    }

    // Sort by timestamp descending
    applications.sort((a, b) => 
        new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );

    res.json(applications);
});

// ─── API: Single Run Detail ───────────────────────────
app.get("/api/runs/:runId", (req, res) => {
    const allRuns = getAllRuns();
    const run = allRuns.find(r => r.id === req.params.runId);
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
});

// ─── API: All Runs ────────────────────────────────────
app.get("/api/runs", (req, res) => {
    const runs = getAllRuns().map(r => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        summary: r.summary,
        scrapeStats: r.scrapeStats,
        resultCount: (r.results || []).length,
        errorCount: (r.errors || []).length
    }));
    res.json(runs);
});

// ─── API: CSV Logs ────────────────────────────────────
app.get("/api/logs", (req, res) => {
    res.json(getAllLogs());
});

// ─── API: CSV Log Content ─────────────────────────────
app.get("/api/logs/:filename", (req, res) => {
    const logs = getAllLogs();
    const log = logs.find(l => l.name === req.params.filename);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json(parseCSV(log.path));
});

// ─── API: Manual Trigger ──────────────────────────────
let pipelineRunning = false;

app.post("/api/run-now", async (req, res) => {
    if (pipelineRunning) {
        return res.status(409).json({ error: "Pipeline is already running" });
    }

    pipelineRunning = true;
    res.json({ status: "started", message: "Pipeline triggered manually" });

    // Run in background
    try {
        const { runPipeline } = require("../src/index");
        await runPipeline();
    } catch (err) {
        console.error(`Dashboard trigger error: ${err.message}`);
    }
    pipelineRunning = false;
});

// ─── API: Pipeline Status ─────────────────────────────
app.get("/api/status", (req, res) => {
    res.json({
        pipelineRunning,
        scheduleCron: process.env.SCHEDULE_CRON || "0 10 * * *",
        nextRun: getNextScheduledRun(),
        positions: (process.env.JOB_TITLES || "").split(",").map(t => t.trim()).filter(Boolean),
        location: process.env.JOB_LOCATION || "Remote"
    });
});

// ─── Helper: Next Scheduled Run ───────────────────────
function getNextScheduledRun() {
    const cron = process.env.SCHEDULE_CRON || "0 10 * * *";
    const parts = cron.split(" ");
    if (parts.length !== 5) return null;
    
    const [minute, hour] = parts;
    const now = new Date();
    const next = new Date();
    next.setHours(parseInt(hour) || 0);
    next.setMinutes(parseInt(minute) || 0);
    next.setSeconds(0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
}

// ─── Start Server ─────────────────────────────────────
const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`  📊 Dashboard running at http://localhost:${PORT}`);
});

module.exports = server;
