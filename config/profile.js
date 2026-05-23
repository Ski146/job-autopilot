// ─── User Profile for Job Applications ────────────────
// Fill this out once — used to auto-fill application forms
// Fields marked REQUIRED are needed for most applications

const PROFILE = {
    // ─── Basic Info (REQUIRED) ─────────────────────────
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // ─── Location ──────────────────────────────────────
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    
    // ─── Online Presence ───────────────────────────────
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    
    // ─── Work Authorization ────────────────────────────
    authorizedToWork: true,      // Are you authorized to work in the US?
    needsSponsorship: false,      // Do you need visa sponsorship?
    
    // ─── Demographics (optional, for EEO forms) ───────
    gender: "",                   // "Male", "Female", "Non-Binary", "Prefer not to say"
    veteranStatus: "I am not a protected veteran",   
    disabilityStatus: "I don't wish to answer",
    race: "",                     // "Asian", "White", etc. or "Prefer not to say"
    
    // ─── Education ─────────────────────────────────────
    highestDegree: "",            // "Bachelor's", "Master's", etc.
    university: "",
    graduationYear: "",
    major: "",
    
    // ─── Experience ────────────────────────────────────
    yearsOfExperience: "",
    currentTitle: "",
    currentCompany: "",
    
    // ─── Preferences ───────────────────────────────────
    desiredSalary: "",            // e.g. "120000" or "Negotiable"
    willingToRelocate: false,
    preferredWorkType: "Remote",  // "Remote", "Hybrid", "On-site"
    startDate: "Immediately",     // "Immediately", "2 weeks", specific date
    
    // ─── Cover Letter Base ─────────────────────────────
    // Brief personal pitch — agents will customize per application
    personalPitch: ""
};

module.exports = PROFILE;
