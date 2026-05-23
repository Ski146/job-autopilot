// ─── 6 LLM Model Definitions ──────────────────────────
// Same models as the Multi-Agent AI council
// Each agent has a specialized role in the job application pipeline

const AGENTS = [
    {
        id: "gpt-oss",
        name: "GPT-OSS 120B",
        model: "openai/gpt-oss-120b:free",
        role: "General reasoning and drafting",
        specialty: "Resume structure and professional tone",
        color: "#6C5CE7"
    },
    {
        id: "qwen3",
        name: "Qwen3 Coder",
        model: "qwen/qwen3-coder:free",
        role: "Coding, automation, and execution",
        specialty: "Technical skills alignment and keyword optimization",
        color: "#00B894"
    },
    {
        id: "nemotron-nano",
        name: "Nemotron Nano 30B",
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        role: "Fast responses and quick analysis",
        specialty: "Quick JD parsing and bullet point generation",
        color: "#FDCB6E"
    },
    {
        id: "deepseek",
        name: "DeepSeek V4 Flash",
        model: "deepseek/deepseek-v4-flash:free",
        role: "Deep analysis and long context",
        specialty: "Deep JD analysis and requirement extraction",
        color: "#E17055"
    },
    {
        id: "nemotron-super",
        name: "Nemotron Super 120B",
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        role: "Complex multi-step reasoning",
        specialty: "Resume synthesis and best-version selection",
        color: "#74B9FF"
    },
    {
        id: "laguna",
        name: "Laguna XS.2",
        model: "poolside/laguna-xs.2:free",
        role: "Agentic coding and tool use",
        specialty: "ATS optimization and format compliance",
        color: "#A29BFE"
    }
];

const SYNTHESIZER = {
    id: "synthesizer",
    name: "Synthesizer (Nemotron Super)",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    color: "#FD79A8"
};

module.exports = { AGENTS, SYNTHESIZER };
