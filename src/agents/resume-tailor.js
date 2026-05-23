// ─── Resume Tailor ─────────────────────────────────────
// All 6 agents produce tailored resume versions in parallel
// Synthesizer picks the best one

const { AGENTS, SYNTHESIZER } = require("../../config/agents");
const { callAllAgents, callModelWithRetry } = require("./openrouter");

/**
 * Tailor a resume for a specific job using all 6 agents
 * @param {Object} job - Job object
 * @param {string} resumeText - Original resume text
 * @param {Object} resumeSections - Parsed resume sections
 * @param {Object} analysis - JD analysis from analyzeJobDescription
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - { bestResume, selectedAgent, allVersions }
 */
async function tailorResume(job, resumeText, resumeSections, analysis, onProgress = null) {
    const systemPrompt = `You are an expert resume tailor and ATS optimization specialist.

YOUR TASK: Rewrite the candidate's resume to be maximally aligned with the target job posting.

STRICT RULES:
1. KEEP THE EXACT SAME FORMAT AND STRUCTURE as the original resume
2. The result MUST fit on ONE PAGE (be concise, cut low-value content if needed)
3. Use ATS-friendly keywords from the job description naturally
4. Quantify achievements wherever possible (use realistic numbers)
5. Prioritize relevant experience and skills that match the JD
6. Keep it truthful — only enhance and reword existing experience, do NOT fabricate new experience
7. Move the most relevant experience/skills to the top
8. Use strong action verbs: "Engineered", "Architected", "Optimized", "Streamlined"
9. Output ONLY the tailored resume text — no commentary, no markdown headers like "# Resume"
10. Start with the candidate's name as the first line

FORMAT: Output the resume as plain text, maintaining the original structure:
- Name (first line)
- Contact info
- Summary/Objective
- Experience (most relevant first)
- Skills (matched to JD)
- Education
- Projects/Certifications (if space permits)`;

    const userPrompt = `ORIGINAL RESUME:
${resumeText}

TARGET JOB:
Position: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}

JOB ANALYSIS (extracted requirements):
${analysis.synthesized || "See job description below"}

JOB DESCRIPTION:
${job.description}

Now rewrite this resume to be perfectly tailored for this specific role. Remember: same format, one page, ATS-optimized.`;

    // All 6 agents tailor the resume in parallel
    const results = await callAllAgents(
        AGENTS,
        (agent) => [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        (agentId, status, data) => {
            if (onProgress) onProgress(agentId, `tailor_${status}`, data);
        }
    );

    const successful = results.filter(r => !r.error && r.content);

    if (successful.length === 0) {
        return { error: "All agents failed to tailor the resume" };
    }

    // If only one succeeded, use it directly
    if (successful.length === 1) {
        return {
            bestResume: successful[0].content,
            selectedAgent: successful[0].agent.name,
            selectedAgentId: successful[0].agent.id,
            allVersions: successful.map(r => ({ agentId: r.agent.id, agentName: r.agent.name, content: r.content }))
        };
    }

    // Synthesizer picks the best version
    const versionList = successful.map((r, i) =>
        `=== VERSION ${i + 1} (by ${r.agent.name}) ===\n${r.content}`
    ).join("\n\n" + "─".repeat(50) + "\n\n");

    const synthResult = await callModelWithRetry(SYNTHESIZER.model, [
        {
            role: "system",
            content: `You are a resume evaluation expert. You will see multiple versions of a tailored resume for the same job.

Your task:
1. Evaluate each version for: ATS keyword optimization, relevance to JD, conciseness, professional tone, formatting
2. Select the SINGLE BEST version OR combine the best elements from multiple versions
3. Output ONLY the final best resume text — nothing else
4. The result must be ONE PAGE and maintain the original resume format

IMPORTANT: Output ONLY the resume text. No commentary, no "I selected version X", just the resume.`
        },
        {
            role: "user",
            content: `TARGET JOB: ${job.title} at ${job.company}

JOB REQUIREMENTS:
${analysis.synthesized || job.description}

RESUME VERSIONS TO EVALUATE:
${versionList}

Output the single best tailored resume:`
        }
    ]);

    // Determine which agent was selected (or if it's a synthesis)
    let selectedAgent = "Synthesized (merged)";
    let selectedAgentId = "synthesizer";

    if (synthResult.content) {
        // Try to detect which version is closest to the synthesis
        let bestMatch = 0;
        let bestMatchIdx = 0;
        for (let i = 0; i < successful.length; i++) {
            const overlap = calculateOverlap(synthResult.content, successful[i].content);
            if (overlap > bestMatch) {
                bestMatch = overlap;
                bestMatchIdx = i;
            }
        }
        if (bestMatch > 0.7) {
            selectedAgent = successful[bestMatchIdx].agent.name;
            selectedAgentId = successful[bestMatchIdx].agent.id;
        }
    }

    return {
        bestResume: synthResult.content || successful[0].content,
        selectedAgent,
        selectedAgentId,
        allVersions: successful.map(r => ({
            agentId: r.agent.id,
            agentName: r.agent.name,
            content: r.content
        }))
    };
}

/**
 * Simple text overlap calculation
 */
function calculateOverlap(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    let overlap = 0;
    for (const w of words1) {
        if (words2.has(w)) overlap++;
    }
    return overlap / Math.max(words1.size, words2.size);
}

module.exports = { tailorResume };
