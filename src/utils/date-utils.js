// ─── Date Utilities ────────────────────────────────────

/**
 * Get current date as YYYY-MM-DD
 */
function today() {
    return new Date().toISOString().split("T")[0];
}

/**
 * Get date string for N days ago
 */
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

/**
 * Check if a date string is within the last N hours
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @param {number} hours - Number of hours to check
 */
function isWithinHours(dateStr, hours = 24) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return date >= cutoff;
}

/**
 * Format a timestamp for logging
 */
function timestamp() {
    return new Date().toISOString().replace("T", " ").split(".")[0];
}

/**
 * Format a date for file naming: YYYY-MM-DD
 */
function fileDate() {
    return today();
}

/**
 * Get a human-readable time string
 */
function timeString() {
    return new Date().toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
    });
}

module.exports = { today, daysAgo, isWithinHours, timestamp, fileDate, timeString };
