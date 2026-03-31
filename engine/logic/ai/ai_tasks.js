import { state, ui } from './ai_state.js';

export async function cleanLogsWithLLM(logs) {
    console.log("Cleaner pass: Deduplicating and summarizing errors...");
    const engine = state.primaryLlmEngine || state.llmEngine;
    if (!engine) throw new Error("LLM Engine not available for Cleaner Pass.");

    const MAX_CHARS_PER_CHUNK = 4000;
    const lines = logs.split('\n');
    const logChunks = [];
    let currentChunk = "";

    for (const line of lines) {
        if (currentChunk.length + line.length > MAX_CHARS_PER_CHUNK) {
            logChunks.push(currentChunk);
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    if (currentChunk.trim()) {
        logChunks.push(currentChunk);
    }

    let summary = "";
    for (let i = 0; i < logChunks.length; i++) {
        const prompt = `Deduplicate and summarize these errors into a technical list.\n\nLogs (Part ${i + 1} of ${logChunks.length}):\n\`\`\`\n${logChunks[i]}\n\`\`\`\n\nSummary:`;
        const stream = await engine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            stream: true,
            temperature: 0.1,
        });
        
        if (i > 0) summary += "\n";

        for await (const chunk of stream) {
            summary += chunk.choices[0]?.delta?.content || "";
        }
    }
    return summary;
}

export async function getDeepAnalysisWithLLM(logs, isSummary, totalExpectedTokens) {
    if (!state.llmEngine) {
        console.error("No active LLM for deep analysis. Please select a loaded model.");
        return `Error: No active LLM available.`;
    }
    const promptIntro = isSummary
        ? "Based on this summarized error report, provide the root cause and the copy-paste fix."
        : "Based on these log snippets, provide the root cause and the copy-paste fix.";

    const prompt = `${promptIntro}\n\n${isSummary ? 'Report' : 'Logs'}:\n\`\`\`\n${logs}\n\`\`\`\n\nRoot Cause and Fix:`;

    try {
        const chunks = await state.llmEngine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            stream: true,
            temperature: 0.2,
        });
        
        let solution = "";
        let tokens = 0;
        for await (const chunk of chunks) {
            solution += chunk.choices[0]?.delta?.content || "";
            tokens++;
            if (tokens % 3 === 0 && ui.updateAnalysisProgressCallback) {
                const progress = 75 + (tokens / (totalExpectedTokens * 0.25)) * 25;
                ui.updateAnalysisProgressCallback(Math.min(99, progress), `Deep analysis with ${state.activeModelId}... (${tokens} tokens)`);
            }
        }
        return solution;
    } catch (error) {
        console.error(`Error during Deep Analysis with ${state.activeModelId}:`, error);
        return `Error: Failed to analyze logs with ${state.activeModelId}. ${error.message}`;
    }
}