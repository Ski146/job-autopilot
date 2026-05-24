// ─── Sample Test: 2 Job Applications ───────────────────
// Tests the full agent pipeline with 2 realistic job postings
// Skips scraping — uses hardcoded JDs to validate the core pipeline

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { parseResume, findResume } = require("../src/resume/parser");
const { processAllJobs } = require("../src/agents/index");
const { logToCSV, logDailySummary } = require("../src/logger/csv-logger");
const { generateResumePDF } = require("../src/resume/generator");
const { createRunLog } = require("../src/logger/run-logger");
const { timestamp } = require("../src/utils/date-utils");
const path = require("path");

// ─── 2 Sample Job Descriptions ────────────────────────
const SAMPLE_JOBS = [
    {
        title: "Data Engineer Intern",
        company: "Snowflake",
        location: "San Mateo, CA (Remote Eligible)",
        url: "https://careers.snowflake.com/sample-job-1",
        description: `Data Engineer Intern - Summer 2026

About the Role:
We are looking for a Data Engineer Intern to join our Data Platform team. You will work on building and optimizing data pipelines that power Snowflake's internal analytics and customer-facing features.

Responsibilities:
- Design, build, and maintain scalable data pipelines using Python and SQL
- Work with Apache Airflow for pipeline orchestration
- Develop ETL/ELT processes to transform raw data into analytics-ready datasets
- Collaborate with data scientists and analysts to understand data requirements
- Write data quality tests and monitoring scripts
- Help optimize existing Snowflake queries and warehouse configurations

Requirements:
- Currently pursuing a Master's or Bachelor's degree in Computer Science, Data Science, or related field
- Strong proficiency in Python and SQL
- Experience with data pipeline tools (Airflow, DBT, or similar)
- Familiarity with cloud platforms (AWS, GCP, or Azure)
- Understanding of data warehouse concepts
- Experience with version control (Git)

Nice to Have:
- Experience with PySpark or Apache Spark
- Knowledge of Docker and Kubernetes
- Exposure to BI tools (Tableau, PowerBI)
- Experience with Snowflake platform

This is a paid internship with competitive compensation. Remote-friendly.`,
        postedDate: new Date().toISOString().split("T")[0],
        source: "career-page"
    },
    {
        title: "SDET (Software Development Engineer in Test)",
        company: "Salesforce",
        location: "Indianapolis, IN (Hybrid)",
        url: "https://careers.salesforce.com/sample-job-2",
        description: `Software Development Engineer in Test (SDET)

About Salesforce:
Salesforce is the global leader in CRM, helping companies connect with their customers in a whole new way.

About the Role:
We are seeking an SDET to join our Quality Engineering team. You will design and implement automated testing frameworks for our cloud platform, ensuring the highest quality across our products.

Responsibilities:
- Design and develop automated test suites for API, UI, and integration testing
- Build and maintain CI/CD pipeline integrations for automated test execution
- Write end-to-end test scripts using Selenium, Postman, and custom frameworks
- Perform API testing for REST and SOAP services
- Collaborate with development teams to identify test requirements early in the development cycle
- Develop performance and load testing scripts
- Create detailed test plans and documentation

Requirements:
- Bachelor's or Master's degree in Computer Science or related field
- 1-3 years of experience in software testing or SDET role
- Strong programming skills in Python or Java
- Experience with test automation frameworks (Selenium, pytest, JUnit)
- Experience with API testing tools (Postman, REST Assured)
- Familiarity with CI/CD tools (Jenkins, GitHub Actions)
- Knowledge of SQL and database testing
- Experience with version control (Git, BitBucket)

Nice to Have:
- Salesforce platform experience or certifications
- Experience with Apex testing
- Knowledge of Kubernetes and Docker
- Exposure to performance testing tools (JMeter, Locust)
- Agile/Scrum methodology experience
- Experience with JIRA for defect tracking

Benefits: Competitive salary, health insurance, 401k matching, flexible PTO.`,
        postedDate: new Date().toISOString().split("T")[0],
        source: "career-page"
    }
];

// ─── Run the Test ──────────────────────────────────────
async function runSampleTest() {
    console.log("");
    console.log("  ╔══════════════════════════════════════════════════════╗");
    console.log("  ║  🧪 SAMPLE TEST — 2 Job Applications               ║");
    console.log("  ║  Testing: Parse → Analyze → Tailor → Log           ║");
    console.log("  ╚══════════════════════════════════════════════════════╝");
    console.log("");

    const runLog = createRunLog();

    // 1. Load resume
    console.log("  [1/4] Loading resume...");
    const resumePath = path.join(__dirname, "../resume/SIJU_SAJI_RESUME.pdf");
    if (!resumePath) {
        console.error("  ❌ No resume found in /resume/ folder");
        return;
    }

    const { raw: resumeText, sections: resumeSections, pages } = await parseResume(resumePath);
    console.log(`  ✓ Resume loaded: ${path.basename(resumePath)} (${pages} page)`);
    console.log(`  ✓ Sections: ${Object.keys(resumeSections).join(", ")}`);
    console.log(`  ✓ Text length: ${resumeText.length} characters\n`);

    // 2. Process the 2 sample jobs
    console.log("  [2/4] Processing 2 sample jobs through 6-agent pipeline...");
    console.log(`  ⚡ This will make ~28 API calls (6 analyze + 6 tailor + 1 synth × 2 jobs + 2 app-prep)\n`);

    const results = await processAllJobs(SAMPLE_JOBS, resumeText, resumeSections);

    // 3. Log results
    console.log("\n  [3/4] Logging results...");
    for (const result of results) {
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

        try {
            const csvPath = logToCSV(result);
            console.log(`    ✓ CSV: ${path.basename(csvPath)}`);
        } catch (err) {
            console.error(`    ⚠ CSV error: ${err.message}`);
        }

        runLog.addResult(result);
    }

    const summaryPath = logDailySummary(results);
    console.log(`    ✓ Summary: ${path.basename(summaryPath)}`);

    // 4. Summary
    const summary = runLog.complete();
    console.log("\n  ══════════════════════════════════════════════════════");
    console.log("  📊 TEST RESULTS:");
    console.log(`     Total: ${summary.totalJobs} jobs processed`);
    console.log(`     ✅ Succeeded: ${summary.succeeded}`);
    console.log(`     ❌ Failed: ${summary.failed}`);
    console.log(`     ⏱  Duration: ${summary.totalDurationMin} minutes`);
    if (Object.keys(summary.modelSelections).length > 0) {
        console.log(`     🏆 Models chosen: ${JSON.stringify(summary.modelSelections)}`);
    }
    console.log("  ══════════════════════════════════════════════════════");

    // Print tailored resume preview
    for (const result of results) {
        if (result.tailoredResume) {
            console.log(`\n  ── Tailored Resume Preview (${result.job.company} - ${result.job.title}) ──`);
            console.log(`  Selected by: ${result.selectedAgent}`);
            console.log("  " + "─".repeat(60));
            console.log(result.tailoredResume.substring(0, 800));
            console.log("  ... (truncated)");
            console.log("  " + "─".repeat(60));
        }
    }
}

runSampleTest().catch(err => {
    console.error("  ❌ Test failed:", err.message);
    console.error(err.stack);
});
