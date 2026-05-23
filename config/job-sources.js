// ─── Job Source Configuration ──────────────────────────
// PRIMARY: Company career pages
// SECONDARY: Job boards (disabled by default, enable as needed)

const JOB_SOURCES = {
    // ─── Indeed (SECONDARY — disabled by default) ─────
    indeed: {
        enabled: false,
        baseUrl: "https://www.indeed.com/jobs",
        maxResults: 15,
        datePosted: "1",
        jobType: "",
        experienceLevel: "",
    },

    // ─── LinkedIn Jobs (SECONDARY — disabled by default)
    linkedin: {
        enabled: false,
        baseUrl: "https://www.linkedin.com/jobs/search",
        maxResults: 15,
        datePosted: "r86400",
        jobType: "F",
        experienceLevel: "",
    },

    // ─── Google Jobs (SECONDARY — disabled by default)
    googleJobs: {
        enabled: false,
        maxResults: 15,
    },

    // ─── Company Career Pages (PRIMARY) ───────────────
    // Add company career page URLs to scrape directly
    // Each entry: { company, careerUrl, searchUrl (optional) }
    customPages: {
        enabled: true,
        companies: [
            // ─── Big Tech ─────────────────────────────
            {
                company: "Google",
                careerUrl: "https://www.google.com/about/careers/applications/jobs/results/",
                searchParams: { location: "United States", q: "" }
            },
            {
                company: "Microsoft",
                careerUrl: "https://careers.microsoft.com/us/en/search-results",
                searchParams: { keywords: "" }
            },
            {
                company: "Amazon",
                careerUrl: "https://www.amazon.jobs/en/search",
                searchParams: { base_query: "", loc_query: "United States" }
            },
            {
                company: "Meta",
                careerUrl: "https://www.metacareers.com/jobs",
                searchParams: { q: "" }
            },
            {
                company: "Apple",
                careerUrl: "https://jobs.apple.com/en-us/search",
                searchParams: { search: "" }
            },
            // ─── Data / Cloud ─────────────────────────
            {
                company: "Snowflake",
                careerUrl: "https://careers.snowflake.com/us/en/search-results",
                searchParams: { keywords: "" }
            },
            {
                company: "Databricks",
                careerUrl: "https://www.databricks.com/company/careers/open-positions",
                searchParams: { q: "" }
            },
            {
                company: "Salesforce",
                careerUrl: "https://careers.salesforce.com/en/jobs/",
                searchParams: { search: "" }
            },
            {
                company: "Oracle",
                careerUrl: "https://careers.oracle.com/jobs/",
                searchParams: { keyword: "" }
            },
            {
                company: "SAP",
                careerUrl: "https://jobs.sap.com/search/",
                searchParams: { q: "" }
            },
            // ─── Consulting / Enterprise ──────────────
            {
                company: "Deloitte",
                careerUrl: "https://apply.deloitte.com/careers/SearchJobs/",
                searchParams: { keyword: "" }
            },
            {
                company: "Accenture",
                careerUrl: "https://www.accenture.com/us-en/careers/jobsearch",
                searchParams: { query: "" }
            },
            {
                company: "IBM",
                careerUrl: "https://www.ibm.com/careers/search",
                searchParams: { query: "" }
            },
            // ─── Fintech / Finance ────────────────────
            {
                company: "JPMorgan Chase",
                careerUrl: "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/requisitions",
                searchParams: { keyword: "" }
            },
            {
                company: "Capital One",
                careerUrl: "https://www.capitalonecareers.com/search-jobs",
                searchParams: { q: "" }
            },
            // ─── Startups / Mid-size ──────────────────
            {
                company: "Palantir",
                careerUrl: "https://www.palantir.com/careers/",
                searchParams: { search: "" }
            },
            {
                company: "Stripe",
                careerUrl: "https://stripe.com/jobs/search",
                searchParams: { query: "" }
            },
            {
                company: "Coinbase",
                careerUrl: "https://www.coinbase.com/careers/positions",
                searchParams: { query: "" }
            },
            // ─── Add more companies below ─────────────
            // { company: "CompanyName", careerUrl: "https://...", searchParams: {} }
        ]
    },

    // ─── Target Positions ─────────────────────────────
    // Searched across ALL sources
    targetPositions: [
        "Data Engineer Intern",
        "Data Engineer",
        "Jr. Data Engineer",
        "Junior Data Engineer",
        "SDET",
        "Software Development Engineer in Test",
        "Salesforce Developer Intern",
        "Salesforce Developer",
    ],

    // ─── Blacklist ─────────────────────────────────────
    blacklist: {
        companies: [],
        keywords: ["clearance required", "ts/sci", "top secret", "polygraph"],
    }
};

module.exports = JOB_SOURCES;
