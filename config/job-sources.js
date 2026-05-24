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
            {
                company: "Nvidia",
                careerUrl: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
                searchParams: { q: "" }
            },

            // ─── AI / ML ──────────────────────────────
            {
                company: "Anthropic",
                careerUrl: "https://www.anthropic.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "OpenAI",
                careerUrl: "https://openai.com/careers/",
                searchParams: { q: "" }
            },
            {
                company: "xAI",
                careerUrl: "https://x.ai/careers",
                searchParams: { q: "" }
            },
            {
                company: "Mistral AI",
                careerUrl: "https://mistral.ai/careers/",
                searchParams: { q: "" }
            },
            {
                company: "Cohere",
                careerUrl: "https://cohere.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "Scale AI",
                careerUrl: "https://scale.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "Hugging Face",
                careerUrl: "https://apply.workable.com/huggingface/",
                searchParams: { q: "" }
            },
            {
                company: "Perplexity",
                careerUrl: "https://www.perplexity.ai/careers",
                searchParams: { q: "" }
            },
            {
                company: "ElevenLabs",
                careerUrl: "https://elevenlabs.io/careers",
                searchParams: { q: "" }
            },
            {
                company: "Harvey",
                careerUrl: "https://www.harvey.ai/careers",
                searchParams: { q: "" }
            },

            // ─── Defense / Gov Tech ───────────────────
            {
                company: "Palantir",
                careerUrl: "https://www.palantir.com/careers/",
                searchParams: { search: "" }
            },
            {
                company: "Anduril",
                careerUrl: "https://www.anduril.com/careers/",
                searchParams: { q: "" }
            },
            {
                company: "Shield AI",
                careerUrl: "https://shield.ai/careers/",
                searchParams: { q: "" }
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
            {
                company: "HashiCorp",
                careerUrl: "https://www.hashicorp.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "MongoDB",
                careerUrl: "https://www.mongodb.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "Elastic",
                careerUrl: "https://www.elastic.co/about/careers",
                searchParams: { q: "" }
            },
            {
                company: "Confluent",
                careerUrl: "https://www.confluent.io/careers/",
                searchParams: { q: "" }
            },
            {
                company: "dbt Labs",
                careerUrl: "https://www.getdbt.com/dbt-labs/open-roles/",
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
            {
                company: "McKinsey",
                careerUrl: "https://www.mckinsey.com/careers/search-jobs",
                searchParams: { q: "" }
            },
            {
                company: "Booz Allen Hamilton",
                careerUrl: "https://careers.boozallen.com/careers/JobSearch",
                searchParams: { keyword: "" }
            },

            // ─── SaaS / Productivity ──────────────────
            {
                company: "Workday",
                careerUrl: "https://workday.wd5.myworkdayjobs.com/Workday",
                searchParams: { keyword: "" }
            },
            {
                company: "ServiceNow",
                careerUrl: "https://careers.servicenow.com/careers",
                searchParams: { q: "" }
            },
            {
                company: "HubSpot",
                careerUrl: "https://www.hubspot.com/careers/jobs",
                searchParams: { q: "" }
            },
            {
                company: "Notion",
                careerUrl: "https://www.notion.so/careers",
                searchParams: { q: "" }
            },
            {
                company: "Figma",
                careerUrl: "https://www.figma.com/careers/",
                searchParams: { q: "" }
            },
            {
                company: "Atlassian",
                careerUrl: "https://www.atlassian.com/company/careers/all-jobs",
                searchParams: { search: "" }
            },
            {
                company: "Dropbox",
                careerUrl: "https://jobs.dropbox.com/all-jobs",
                searchParams: { q: "" }
            },
            {
                company: "Rippling",
                careerUrl: "https://www.rippling.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Deel",
                careerUrl: "https://www.deel.com/careers",
                searchParams: { q: "" }
            },

            // ─── Fintech / Payments ───────────────────
            {
                company: "Stripe",
                careerUrl: "https://stripe.com/jobs/search",
                searchParams: { query: "" }
            },
            {
                company: "Adyen",
                careerUrl: "https://careers.adyen.com/",
                searchParams: { keyword: "" }
            },
            {
                company: "Plaid",
                careerUrl: "https://plaid.com/careers/",
                searchParams: { keyword: "" }
            },
            {
                company: "Ramp",
                careerUrl: "https://ramp.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Brex",
                careerUrl: "https://www.brex.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Wise",
                careerUrl: "https://wise.jobs/",
                searchParams: { keyword: "" }
            },
            {
                company: "Chime",
                careerUrl: "https://careers.chime.com/",
                searchParams: { keyword: "" }
            },
            {
                company: "Coinbase",
                careerUrl: "https://www.coinbase.com/careers/positions",
                searchParams: { query: "" }
            },
            {
                company: "Robinhood",
                careerUrl: "https://careers.robinhood.com/",
                searchParams: { keyword: "" }
            },
            {
                company: "Affirm",
                careerUrl: "https://www.affirm.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Klarna",
                careerUrl: "https://www.klarna.com/careers/",
                searchParams: { keyword: "" }
            },
            {
                company: "Square",
                careerUrl: "https://block.xyz/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "SoFi",
                careerUrl: "https://www.sofi.com/careers/",
                searchParams: { keyword: "" }
            },
            {
                company: "Mercury",
                careerUrl: "https://mercury.com/jobs/",
                searchParams: { keyword: "" }
            },
            {
                company: "Finix",
                careerUrl: "https://finix.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Slash",
                careerUrl: "https://www.slash.com/company/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Sila",
                careerUrl: "https://www.silamoney.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Bill.com",
                careerUrl: "https://www.bill.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Navan",
                careerUrl: "https://navan.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Tipalti",
                careerUrl: "https://tipalti.com/careers/",
                searchParams: { keyword: "" }
            },
            {
                company: "Modern Treasury",
                careerUrl: "https://www.moderntreasury.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Expensify",
                careerUrl: "https://use.expensify.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Coupa",
                careerUrl: "https://careers.coupa.com/",
                searchParams: { keyword: "" }
            },
            {
                company: "Airbase",
                careerUrl: "https://www.airbase.com/careers",
                searchParams: { keyword: "" }
            },
            {
                company: "Mesh Payments",
                careerUrl: "https://meshpayments.com/careers/",
                searchParams: { keyword: "" }
            },
            {
                company: "Toast",
                careerUrl: "https://careers.toasttab.com/",
                searchParams: { keyword: "" }
            },
            {
                company: "Revolut",
                careerUrl: "https://www.revolut.com/careers/",
                searchParams: { keyword: "" }
            },

            // ─── Finance / Banking ────────────────────
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
            {
                company: "Goldman Sachs",
                careerUrl: "https://higher.gs.com/roles",
                searchParams: { q: "" }
            },
            {
                company: "Visa",
                careerUrl: "https://corporate.visa.com/en/jobs/",
                searchParams: { q: "" }
            },
            {
                company: "Mastercard",
                careerUrl: "https://careers.mastercard.com/us/en/",
                searchParams: { keywords: "" }
            },

            // ─── Cybersecurity ────────────────────────
            {
                company: "CrowdStrike",
                careerUrl: "https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers",
                searchParams: { q: "" }
            },
            {
                company: "Palo Alto Networks",
                careerUrl: "https://jobs.paloaltonetworks.com/en/jobs/",
                searchParams: { keyword: "" }
            },
            {
                company: "SentinelOne",
                careerUrl: "https://www.sentinelone.com/careers/",
                searchParams: { q: "" }
            },
            {
                company: "Wiz",
                careerUrl: "https://www.wiz.io/careers",
                searchParams: { q: "" }
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
        "Jr. Salesforce Developer",
        "Junior Salesforce Developer",
        "Data Analyst Intern",
        "Data Analyst",
        "Jr. Data Analyst",
        "Junior Data Analyst"
    ],

    // ─── Blacklist ─────────────────────────────────────
    blacklist: {
        companies: [],
        keywords: ["clearance required", "ts/sci", "top secret", "polygraph"],
    }
};

module.exports = JOB_SOURCES;
