import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';
import * as config from './ai_config.js';
import { state, ui } from './ai_state.js';

/**
 * Helper function to load an engine from Hugging Face.
 */
async function loadEngine(modelId, progressCallback) {
    console.log(`Attempting to load ${modelId} from Hugging Face...`);
    return await CreateMLCEngine(modelId, { 
        initProgressCallback: progressCallback,
        appConfig: config.appConfig
    });
}

/**
 * Initializes the primary LLM engine.
 * Attempts to load a fallback model if the primary fails.
 */
export async function initializeLLMEngine() {
    if (state.llmEngineLoaded) {
        console.log(`LLM engine with model ${state.activeModelId} is already loaded.`);
        return true;
    }
    if (state.isLLMEngineLoading) {
        return false;
    }

    state.isLLMEngineLoading = true;
    let success = false;

    if (ui.modelProgressContainerRef) {
        ui.modelProgressContainerRef.style.display = 'block';
        if (ui.modelProgressLabelRef) ui.modelProgressLabelRef.textContent = 'Preparing system...';
    }

    console.log(`Preparing system...`);
    try {
        state.llmEngine = await loadEngine(
            config.primaryModelId,
            (report) => {
                const progress = (report.progress * 100);
                if (ui.modelProgressBarRef) ui.modelProgressBarRef.value = progress;
                if (ui.modelProgressTextRef) ui.modelProgressTextRef.textContent = ` ${progress.toFixed(0)}%`;
            }
        );
        state.primaryLlmEngine = state.llmEngine;
        state.llmEngineLoaded = true;
        state.activeModelId = config.primaryModelId;
        if (ui.activeLlmDisplayRef) {
            ui.activeLlmDisplayRef.textContent = `Model: ${state.activeModelId}`;
        }
        if (ui.updateDropdownStylesCallback) ui.updateDropdownStylesCallback();

        success = true;
        if (ui.modelProgressContainerRef) ui.modelProgressContainerRef.style.display = 'none';
    } catch (primaryError) {
        console.error(`Failed to load primary LLM engine:`, primaryError);
        console.log(`Failed to load primary LLM (${config.primaryModelId}). Attempting fallback LLM: ${config.secondaryModelId}...`);
        if (ui.modelProgressLabelRef) ui.modelProgressLabelRef.textContent = 'Attempting fallback model...';

        try {
            state.llmEngine = await loadEngine(
                config.secondaryModelId,
                (report) => {
                    const progress = (report.progress * 100);
                    if (ui.modelProgressBarRef) ui.modelProgressBarRef.value = progress;
                    if (ui.modelProgressTextRef) ui.modelProgressTextRef.textContent = ` ${progress.toFixed(0)}%`;
                }
            );
            state.secondaryLlmEngine = state.llmEngine; // Also store as secondary
            state.isSecondaryLoaded = true;
            state.llmEngineLoaded = true;
            state.activeModelId = config.secondaryModelId;
            if (ui.activeLlmDisplayRef) {
                ui.activeLlmDisplayRef.textContent = `Model: ${state.activeModelId}`;
            }
            if (ui.updateDropdownStylesCallback) ui.updateDropdownStylesCallback();
            success = true;
            if (ui.modelProgressContainerRef) ui.modelProgressContainerRef.style.display = 'none';
        } catch (fallbackError) {
            console.error("Failed to load fallback LLM engine:", fallbackError);
            let errorMessage = `Error loading any LLM engine.\n\n`;
            errorMessage += `Primary model (${config.primaryModelId}) failed: ${primaryError.message || primaryError}\n`;
            errorMessage += `Fallback model (${config.secondaryModelId}) failed: ${fallbackError.message || fallbackError}\n\n`;
            errorMessage += "This typically happens for one of two reasons:\n\n" +
                           "1. **You must use a local web server.** Opening this HTML file directly (e.g., as a 'file:///...') will not work.\n\n" +
                           "2. **Your browser cache might be full or corrupted.** Please try clearing your browser's site data for this page and try again.";
            console.error(errorMessage);
            state.llmEngineLoaded = false;
            state.isLLMEngineLoading = false;
            if (ui.activeLlmDisplayRef) { ui.activeLlmDisplayRef.textContent = `Model loading failed for both ${config.primaryModelId} and ${config.secondaryModelId}`; }
            if (ui.modelProgressContainerRef) ui.modelProgressContainerRef.style.display = 'none';
            return false;
        }
    }
    state.isLLMEngineLoading = false;
    return success;
}

/**
 * Loads the secondary LLM model in the background.
 */
export async function loadSecondaryInBackground() {
    if (state.isSecondaryLoaded || state.isSecondaryLoading) return;

    state.isSecondaryLoading = true;
    if (ui.modelProgressContainerRef) {
        ui.modelProgressContainerRef.style.display = 'block';
        if (ui.modelProgressLabelRef) ui.modelProgressLabelRef.textContent = 'Downloading upgraded model...';
    }

    console.log(`[Background] Starting download of secondary model: ${config.secondaryModelId}...`);
    try {
        state.secondaryLlmEngine = await loadEngine(
            config.secondaryModelId,
            (report) => {
                const progress = (report.progress * 100);
                if (ui.modelProgressBarRef) ui.modelProgressBarRef.value = progress;
                if (ui.modelProgressTextRef) ui.modelProgressTextRef.textContent = ` ${progress.toFixed(0)}%`;
                console.log(`[Background] Loading ${config.secondaryModelId}: ${report.text} (${progress.toFixed(2)}%)`);
            }
        );
        state.isSecondaryLoaded = true;
        state.isSecondaryLoading = false;
        console.log(`[Background] Secondary model ${config.secondaryModelId} loaded successfully. It is now available for selection.`);
        
        if (ui.modelProgressContainerRef) ui.modelProgressContainerRef.style.display = 'none';

    } catch (error) {
        state.isSecondaryLoading = false;
        if (ui.modelProgressContainerRef) ui.modelProgressContainerRef.style.display = 'none';
        console.error(`[Background] Failed to load secondary model ${config.secondaryModelId}:`, error);
        let errorMessage = `Failed to download upgraded model: ${error.message || error}\n\n`;
        if (error.name === "NetworkError" || (error.message && (error.message.includes("Cache") || error.message.includes("network error")))) {
            errorMessage += "This can happen for a few reasons:\n\n" +
                           "1. **Local Server Required:** Ensure you are running this from a local web server (http://) and not as a local file (file:///).\n\n" +
                           "2. **Model Files Missing:** Verify that the model folder `engine/core/" + config.secondaryModelId + "` exists and contains all the necessary model files.\n\n" +
                           "3. **Browser Cache:** Your browser's cache might be corrupted. Try clearing site data for this page and reloading.";
        }
        console.error(errorMessage);
        throw error; // Re-throw to allow caller to handle it
    }
}

/**
 * Switches the active LLM engine.
 * @param {string} selectedModelId The ID of the model to switch to.
 */
export async function switchActiveModel(selectedModelId) {
    if (selectedModelId === state.activeModelId) {
        console.log(`Model ${selectedModelId} is already active.`);
        return;
    }

    if (selectedModelId === config.primaryModelId) {
        if (state.primaryLlmEngine) {
            state.llmEngine = state.primaryLlmEngine;
            state.activeModelId = config.primaryModelId;
            console.log(`Switched to ${state.activeModelId}.`);
        } else {
            console.warn(`Primary model ${config.primaryModelId} is not available. It may have failed to load.`);
            return;
        }
    } else if (selectedModelId === config.secondaryModelId) {
        if (state.isSecondaryLoaded) {
            state.llmEngine = state.secondaryLlmEngine;
            state.activeModelId = config.secondaryModelId;
            console.log(`Switched to ${state.activeModelId}.`);
        } else {
            console.log(`Secondary model ${config.secondaryModelId} is not loaded. Starting download...`);
            try {
                await loadSecondaryInBackground();
                if (state.isSecondaryLoaded) {
                    state.llmEngine = state.secondaryLlmEngine;
                    state.activeModelId = config.secondaryModelId;
                    console.log(`Switched to ${state.activeModelId}.`);
                } else {
                    console.error(`Failed to switch to ${config.secondaryModelId} because it failed to load.`);
                    if (ui.updateDropdownStylesCallback) ui.updateDropdownStylesCallback();
                    return;
                }
            } catch (err) {
                console.error(`Error loading secondary model during switch:`, err);
                if (ui.updateDropdownStylesCallback) ui.updateDropdownStylesCallback();
                return;
            }
        }
    }

    if (ui.activeLlmDisplayRef) ui.activeLlmDisplayRef.textContent = `Model: ${state.activeModelId}`;
    if (ui.updateDropdownStylesCallback) ui.updateDropdownStylesCallback();
    console.log(`Active LLM for analysis is now: ${state.activeModelId}`);
}