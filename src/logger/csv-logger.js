// ─── CSV Logger ────────────────────────────────────────
// Writes application data to CSV files
// Naming: {modelname}_{date}_{position}.csv

const fs = require("fs");
const path = require("path");
const { fileDate } = require("../utils/date-utils");

const OUTPUT_DIR = path.join(__dirname, "../../output/logs");

/**
 * Ensure the output directory exists
 */
function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

/**
 * Sanitize a string for use in file names
 */
function sanitize(str) {
    return (str || "unknown")
        .replace(/[^a-zA-Z0-9\-_]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, 50);
}

/**
 * Escape a CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(value) {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Write a single application result to a model-specific CSV
 * File name: {modelname}_{date}_{position}.csv
 * @param {Object} result - Pipeline result from processJob
 */
function logToCSV(result) {
    ensureOutputDir();

    const modelName = sanitize(result.selectedAgent || result.selectedAgentId || "unknown");
    const date = fileDate();
    const position = sanitize(result.job?.title || "unknown");
    const filename = `${modelName}_${date}_${position}.csv`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const headers = [
        "timestamp",
        "company",
        "position",
        "location",
        "job_url",
        "source",
        "status",
        "selected_model",
        "agents_succeeded",
        "application_date",
        "tailored_resume_path",
        "duration_seconds",
        "job_description",
        "tailored_resume",
        "application_responses"
    ];

    const row = [
        result.timestamp || new Date().toISOString(),
        result.job?.company || "",
        result.job?.title || "",
        result.job?.location || "",
        result.job?.url || "",
        result.job?.source || "",
        result.status || "unknown",
        result.selectedAgent || "",
        result.analysis?.agentCount || 0,
        date,
        result.resumePdfPath || "",
        ((result.duration || 0) / 1000).toFixed(1),
        (result.job?.description || "").substring(0, 2000),
        (result.tailoredResume || "").substring(0, 3000),
        result.applicationData?.responses || ""
    ];

    const isNew = !fs.existsSync(filepath);
    const csvLine = row.map(escapeCSV).join(",") + "\n";

    if (isNew) {
        fs.writeFileSync(filepath, headers.join(",") + "\n" + csvLine);
    } else {
        fs.appendFileSync(filepath, csvLine);
    }

    return filepath;
}

/**
 * Write all results from a run to a single daily summary CSV
 */
function logDailySummary(results) {
    ensureOutputDir();

    const date = fileDate();
    const filename = `daily_summary_${date}.csv`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const headers = [
        "timestamp", "company", "position", "location", "status",
        "selected_model", "duration_seconds", "job_url"
    ];

    let content = headers.join(",") + "\n";

    for (const result of results) {
        const row = [
            result.timestamp || new Date().toISOString(),
            result.job?.company || "",
            result.job?.title || "",
            result.job?.location || "",
            result.status || "unknown",
            result.selectedAgent || "",
            ((result.duration || 0) / 1000).toFixed(1),
            result.job?.url || ""
        ];
        content += row.map(escapeCSV).join(",") + "\n";
    }

    fs.writeFileSync(filepath, content);
    return filepath;
}

/**
 * Get all CSV files from the output directory
 */
function getAllLogs() {
    ensureOutputDir();
    return fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith(".csv"))
        .map(f => ({
            name: f,
            path: path.join(OUTPUT_DIR, f),
            size: fs.statSync(path.join(OUTPUT_DIR, f)).size,
            modified: fs.statSync(path.join(OUTPUT_DIR, f)).mtime
        }))
        .sort((a, b) => b.modified - a.modified);
}

/**
 * Parse a CSV file and return rows as objects
 */
function parseCSV(filepath) {
    if (!fs.existsSync(filepath)) return [];

    const content = fs.readFileSync(filepath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
        rows.push(row);
    }

    return rows;
}

/**
 * Parse a single CSV line respecting quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }
    }
    result.push(current);
    return result;
}

module.exports = { logToCSV, logDailySummary, getAllLogs, parseCSV };
