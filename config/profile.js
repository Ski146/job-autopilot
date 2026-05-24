// ─── User Profile for Job Applications ────────────────
// Auto-filled from resume. Edit as needed.
// Fields marked REQUIRED are needed for most applications

const PROFILE = {
    // ─── Basic Info (REQUIRED) ─────────────────────────
    firstName: "Siju",
    lastName: "Saji",
    email: "lnus4@mail.uc.edu",
    phone: "+1 (513) 237-9733",
    
    // ─── Location ──────────────────────────────────────
    city: "Cincinnati",
    state: "OH",
    zipCode: "",           // ← FILL THIS IN
    country: "United States",
    
    // ─── Online Presence ───────────────────────────────
    linkedinUrl: "",        // ← FILL: your full LinkedIn URL
    githubUrl: "https://github.com/Ski146",
    portfolioUrl: "",       // ← FILL if you have one
    
    // ─── Work Authorization ────────────────────────────
    authorizedToWork: true,
    needsSponsorship: false,
    
    // ─── Demographics (for EEO forms) ──────────────────
    gender: "Male",
    veteranStatus: "I am not a protected veteran",
    disabilityStatus: "No, I don't have a disability",
    race: "Asian",
    
    // ─── Education ─────────────────────────────────────
    highestDegree: "Master's",
    university: "University of Cincinnati",
    graduationYear: "2026",
    major: "Computer Science",
    
    // ─── Experience ────────────────────────────────────
    yearsOfExperience: "2",
    currentTitle: "Graduate Student / Salesforce Developer",
    currentCompany: "University of Cincinnati",
    
    // ─── Preferences ───────────────────────────────────
    desiredSalary: "Negotiable",
    willingToRelocate: true,
    preferredWorkType: "Remote",
    startDate: "Immediately",
    
    // ─── Cover Letter Base ─────────────────────────────
    personalPitch: "Data engineering and software specialist graduate student with 2+ years of hands-on experience designing and optimizing ETL pipelines, data warehouses, and cloud-native architectures using Python, SQL, PySpark, DBT, Airflow, and Snowflake. Experienced with AWS, Docker, Kubernetes, and BI tools. Strong background in pipeline orchestration, automation, and data quality testing."
};

module.exports = PROFILE;
