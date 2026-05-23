// ─── Job Description Analyzer ──────────────────────────
// All 6 agents analyze the JD in parallel and extract structured info

const { AGENTS } = require("../../config/agents");
const { callAllAgents, callModelWithRetry } = require("./openrouter");
const { SYNTHESIZER } = require("../../config/agents");

/**
 * Analyze a job description using all 6 agents
 * @param {Object} job - { title, company, description, ... }
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Structured analysis
 */
async function analyzeJobDescription(job, onProgress = null) {
    const systemPrompt = `You are an expert job description analyzer. Extract structured information from the following job posting.

Return your analysis in this EXACT format (use these exact headers):

REQUIRED SKILLS:
- skill 1
- skill 2

NICE-TO-HAVE SKILLS:
- skill 1

KEY TECHNOLOGIES:
- tech 1
- tech 2

EXPERIENCE LEVEL: [Entry/Junior/Mid/Senior]

KEY RESPONSIBILITIES:
- responsibility 1

ATS KEYWORDS:
- keyword 1
- keyword 2

COMPANY CULTURE SIGNALS:
- signal 1

Be thorough and extract EVERY relevant skill, technology, and keyword from the JD.`;

    const userPrompt = `Analyze this job posting:

POSITION: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location || "Not specified"}

JOB DESCRIPTION:
${job.description}`;

    const results = await callAllAgents(
        AGENTS,
        (agent) => [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        (agentId, status, data) => {
            if (onProgress) onProgress(agentId, `analyze_${status}`, data);
        }
    );

    const successful = results.filter(r => !r.error);

    if (successful.length === 0) {
        return { error: "All agents failed to analyze the job description" };
    }

    // Synthesize the best analysis from all agent outputs
    const agentOutputs = successful.map(r =>
        `[${r.agent.name}]:\n${r.content}`
    ).join("\n\n---\n\n");

    const synthResult = await callModelWithRetry(SYNTHESIZER.model, [
        {
            role: "system",
            content: `You are a synthesis expert. Multiple AI agents analyzed the same job description. 
Merge their analyses into ONE comprehensive, deduplicated result.
Use the same format (REQUIRED SKILLS, NICE-TO-HAVE SKILLS, KEY TECHNOLOGIES, EXPERIENCE LEVEL, KEY RESPONSIBILITIES, ATS KEYWORDS, COMPANY CULTURE SIGNALS).
Include ALL unique items from every agent. Remove duplicates.`
        },
        {
            role: "user",
            content: `Merge these job description analyses:\n\n${agentOutputs}`
        }
    ]);

    return {
        synthesized: synthResult.content || agentOutputs,
        agentCount: successful.length,
        failedCount: results.length - successful.length,
        rawOutputs: results.map(r => ({
            agentId: r.agent.id,
            agentName: r.agent.name,
            content: r.content || null,
            error: r.error || null
        }))
    };
}

module.exports = { analyzeJobDescription };
