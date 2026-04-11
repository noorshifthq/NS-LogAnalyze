import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Configuration for NoorShift 0.5B implementation
const MODEL_ID = "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC";
const ESTIMATED_SIZE_MB = 362.4; 
let engine;

// Select Elements
const downloadBtn = document.getElementById('download-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const storageInfo = document.getElementById('storage-info');

// 1. Initial Storage Check
(async () => {
    if (navigator.storage && navigator.storage.estimate) {
        const { quota, usage } = await navigator.storage.estimate();
        const availableMB = Math.round((quota - usage) / (1024 * 1024));
        storageInfo.innerText = `Local Disk: ~${availableMB}MB available.`;
    }
})();

// 2. Download and Cache Model
downloadBtn.onclick = async () => {
    downloadBtn.disabled = true;
    document.getElementById('progress-container').classList.remove('hidden');

    const initProgressCallback = (report) => {
        // Calculate and show current MBs
        const currentMB = (report.progress * ESTIMATED_SIZE_MB).toFixed(1);
        statusText.innerText = `${report.text} (${currentMB}MB / ${ESTIMATED_SIZE_MB}MB)`;
        
        if (report.progress !== undefined) {
            progressBar.style.width = `${report.progress * 100}%`;
        }
    };

    try {
        engine = await webllm.CreateMLCEngine(MODEL_ID, { initProgressCallback });
        
        // UI Transition to Analyzer
        document.getElementById('setup-container').classList.add('hidden');
        document.getElementById('analyzer-container').classList.remove('hidden');
    } catch (e) {
        statusText.innerHTML = `<span style="color:#ef4444">Setup Failed. Ensure WebGPU is enabled in your browser.</span> 
                                <br><button onclick="location.reload()">Retry</button>`;
        console.error(e);
    }
};

// 3. Local Inference Logic
analyzeBtn.onclick = async () => {
    const logs = document.getElementById('log-input').value;
    if (!logs) return alert("Please paste logs first.");

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Processing Locally...";
    document.getElementById('output-card').classList.remove('hidden');
    const responseBox = document.getElementById('ai-response');
    responseBox.innerText = "Analyzing logs for errors...";

    const messages = [
        { role: "system", content: "You are a senior DevOps expert. Identify the error in the logs and provide a concise solution." },
        { role: "user", content: `Logs:\n${logs}` }
    ];

    try {
        const reply = await engine.chat.completions.create({ 
            messages,
            temperature: 0.1 // Low temperature for higher accuracy in log analysis
        });
        responseBox.innerText = reply.choices[0].message.content;
    } catch (e) {
        responseBox.innerText = "Error during analysis: " + e.message;
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerText = "Analyze Locally";
    }
};

// 4. Reset/Clear Cache Logic
resetBtn.onclick = async () => {
    if (confirm("Clear local AI cache? This frees ~360MB but requires a re-download next time.")) {
        try {
            // Clears Cache API and IndexedDB
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            window.indexedDB.deleteDatabase("next_cache");
            alert("Cache cleared successfully.");
            location.reload();
        } catch (e) {
            alert("Error clearing cache: " + e.message);
        }
    }
};