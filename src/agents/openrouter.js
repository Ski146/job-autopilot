// ─── OpenRouter API Client ─────────────────────────────
// Shared HTTP client for all 6 LLM models
// Supports retry logic, timeout handling, and rate limiting

const https = require("https");

const BASE_URL = "openrouter.ai";
const MAX_RETRIES = 2;
const TIMEOUT_MS = 180000; // 3 minutes for longer resume tasks

/**
 * Call an OpenRouter model with messages
 * @param {string} model - Model identifier (e.g., "openai/gpt-oss-120b:free")
 * @param {Array} messages - Chat messages array
 * @param {Object} options - Optional overrides
 * @returns {Promise<{content: string, usage: Object} | {error: string}>}
 */
function callModel(model, messages, options = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return Promise.resolve({ error: "OPENROUTER_API_KEY not set in .env" });
    }

    const maxTokens = options.maxTokens || 4000;
    const timeout = options.timeout || TIMEOUT_MS;

    return new Promise((resolve) => {
        const body = JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages
        });

        const req = https.request({
            hostname: BASE_URL,
            path: "/api/v1/chat/completions",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://job-autopilot.local",
                "X-Title": "Job Autopilot"
            }
        }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        resolve({ error: parsed.error.message || "Unknown API error" });
                    } else {
                        const content = parsed.choices?.[0]?.message?.content || "";
                        const usage = parsed.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                        if (!content.trim()) {
                            resolve({ error: "Model returned empty response" });
                        } else {
                            resolve({ content, usage });
                        }
                    }
                } catch {
                    resolve({ error: "Failed to parse API response" });
                }
            });
        });

        req.on("error", (err) => resolve({ error: err.message }));
        req.setTimeout(timeout, () => {
            req.destroy();
            resolve({ error: `Request timed out (${timeout / 1000}s)` });
        });
        req.write(body);
        req.end();
    });
}

/**
 * Call a model with automatic retry on failure
 * @param {string} model - Model identifier
 * @param {Array} messages - Chat messages
 * @param {Function} onRetry - Callback on retry: (attempt, maxRetries, error)
 * @param {Object} options - Optional overrides
 * @returns {Promise<{content: string, usage: Object} | {error: string}>}
 */
async function callModelWithRetry(model, messages, onRetry = null, options = {}) {
    let lastError = null;
    const retries = options.retries || MAX_RETRIES;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        if (attempt > 1) {
            if (onRetry) onRetry(attempt, retries + 1, lastError);
            // Exponential backoff
            await new Promise(r => setTimeout(r, 2000 * attempt));
        }

        const result = await callModel(model, messages, options);

        if (!result.error) {
            return result;
        }

        lastError = result.error;
    }

    return { error: `Failed after ${retries + 1} attempts. Last error: ${lastError}` };
}

/**
 * Call all agents in parallel with the same prompt
 * @param {Array} agents - Array of agent configs from config/agents.js
 * @param {Array} messagesBuilder - Function that takes agent and returns messages array
 * @param {Function} onProgress - Progress callback: (agentId, status, data)
 * @returns {Promise<Array<{agent, content, usage} | {agent, error}>>}
 */
async function callAllAgents(agents, messagesBuilder, onProgress = null) {
    const promises = agents.map(async (agent) => {
        if (onProgress) onProgress(agent.id, "start", { name: agent.name });

        const messages = typeof messagesBuilder === "function" 
            ? messagesBuilder(agent) 
            : messagesBuilder;

        const result = await callModelWithRetry(
            agent.model,
            messages,
            (attempt, max, err) => {
                if (onProgress) onProgress(agent.id, "retry", { attempt, max, error: err });
            }
        );

        if (result.error) {
            if (onProgress) onProgress(agent.id, "error", { error: result.error });
            return { agent, error: result.error };
        }

        if (onProgress) onProgress(agent.id, "done", { content: result.content, usage: result.usage });
        return { agent, content: result.content, usage: result.usage };
    });

    return Promise.all(promises);
}

module.exports = { callModel, callModelWithRetry, callAllAgents };
