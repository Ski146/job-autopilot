// ─── Scheduler ─────────────────────────────────────────
// Daily 10 AM job using node-cron

const cron = require("node-cron");
const { timestamp } = require("./utils/date-utils");

/**
 * Start the cron scheduler
 * @param {string} cronExpression - Cron expression (default: "0 10 * * *" = 10 AM daily)
 * @param {Function} pipelineFn - The pipeline function to execute
 */
function startScheduler(cronExpression, pipelineFn) {
    if (!cron.validate(cronExpression)) {
        console.error(`  ❌ Invalid cron expression: "${cronExpression}"`);
        console.error(`  💡 Use format: "minute hour day-of-month month day-of-week"`);
        console.error(`  💡 Example: "0 10 * * *" = every day at 10:00 AM`);
        process.exit(1);
    }

    console.log(`  ⏰ Scheduling pipeline: "${cronExpression}"`);
    console.log(`  📅 Next run: ${getNextRunTime(cronExpression)}`);

    let isRunning = false;

    const task = cron.schedule(cronExpression, async () => {
        if (isRunning) {
            console.log(`  ⚠ Pipeline already running, skipping this trigger`);
            return;
        }

        isRunning = true;
        console.log(`\n  ⏰ Scheduled trigger at ${timestamp()}`);

        try {
            await pipelineFn();
        } catch (err) {
            console.error(`  ❌ Scheduled pipeline failed: ${err.message}`);
        }

        isRunning = false;
        console.log(`  📅 Next run: ${getNextRunTime(cronExpression)}`);
    }, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
        console.log("\n  🛑 Shutting down scheduler...");
        task.stop();
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        task.stop();
        process.exit(0);
    });

    return task;
}

/**
 * Get a human-readable next run time from a cron expression
 */
function getNextRunTime(cronExpression) {
    // Simple parsing for common patterns
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return "Unknown";

    const [minute, hour] = parts;
    const now = new Date();
    const next = new Date();
    
    next.setHours(parseInt(hour) || 0);
    next.setMinutes(parseInt(minute) || 0);
    next.setSeconds(0);

    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    return next.toLocaleString();
}

module.exports = { startScheduler };
