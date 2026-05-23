// ─── Application Data Preparer ─────────────────────────
// Generates pre-filled application data for each job

const { AGENTS } = require("../../config/agents");
const { callModelWithRetry } = require("./openrouter");
const PROFILE = require("../../config/profile");

/**
 * Prepare application data for a job
 * Uses a single agent (fastest one) since this is straightforward
 * @param {Object} job - Job object
 * @param {string} tailoredResume - The selected tailored resume text
 * @param {Object} analysis - JD analysis
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Application data
 */
async function prepareApplicationData(job, tailoredResume, analysis, onProgress = null) {
    // Use the fastest agent for this task
    const agent = AGENTS.find(a => a.id === "nemotron-nano") || AGENTS[0];

    const result = await callModelWithRetry(agent.model, [
        {
            role: "system",
            content: `You are an expert job application assistant. Based on the candidate's tailored resume and the job posting, generate application responses.

Output in this EXACT format:

COVER_LETTER_POINTS:
- Point 1 connecting experience to role
- Point 2 about relevant skills
- Point 3 about company alignment

WHY_THIS_COMPANY:
A 2-3 sentence answer for "Why do you want to work at [company]?"

WHY_THIS_ROLE:
A 2-3 sentence answer for "Why are you interested in this role?"

BIGGEST_STRENGTH:
A 1-2 sentence answer

ADDITIONAL_INFO:
Any additional relevant information the candidate should include

Be specific to this company and role. Use details from the job description.`
        },
        {
            role: "user",
            content: `TAILORED RESUME:\n${tailoredResume}\n\nJOB: ${job.title} at ${job.company}\nDESCRIPTION:\n${job.description?.substring(0, 2000) || "N/A"}`
        }
    ]);

    return {
        responses: result.content || "",
        profile: {
            firstName: PROFILE.firstName,
            lastName: PROFILE.lastName,
            email: PROFILE.email,
            phone: PROFILE.phone,
            linkedinUrl: PROFILE.linkedinUrl,
            githubUrl: PROFILE.githubUrl,
            authorizedToWork: PROFILE.authorizedToWork,
            needsSponsorship: PROFILE.needsSponsorship,
            gender: PROFILE.gender,
            veteranStatus: PROFILE.veteranStatus,
            disabilityStatus: PROFILE.disabilityStatus,
        },
        generatedBy: agent.name
    };
}

module.exports = { prepareApplicationData };
