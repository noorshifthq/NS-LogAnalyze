import * as config from './ai_config.js';

// This object holds the mutable state for the AI engine.
// Other modules will import this and modify its properties.
export const state = {
    llmEngine: null,
    isLLMEngineLoading: false,
    llmEngineLoaded: false,
    activeModelId: null,
    primaryLlmEngine: null,
    secondaryLlmEngine: null,
    isSecondaryLoading: false,
    isSecondaryLoaded: false,
};

// This object holds references to UI elements and callbacks.
export const ui = {
    updateAnalysisProgressCallback: null,
    updateDropdownStylesCallback: null,
    activeLlmDisplayRef: null,
    analysisOutputRef: null,
    modelProgressContainerRef: null,
    modelProgressBarRef: null,
    modelProgressTextRef: null,
    modelProgressLabelRef: null,
};

/**
 * Initializes the AI logic module with UI element references and update callbacks.
 */
export function initAILogic(uiRefs, uiCallbacks) {
    ui.activeLlmDisplayRef = uiRefs.activeLlmDisplay;
    ui.analysisOutputRef = uiRefs.analysisOutput;
    ui.modelProgressContainerRef = uiRefs.modelProgressContainer;
    ui.modelProgressBarRef = uiRefs.modelProgressBar;
    ui.modelProgressTextRef = uiRefs.modelProgressText;
    ui.modelProgressLabelRef = uiRefs.modelProgressLabel;

    ui.updateAnalysisProgressCallback = uiCallbacks.updateAnalysisProgress;
    ui.updateDropdownStylesCallback = uiCallbacks.updateDropdownStyles;

    console.log(`Configured to use ${config.primaryModelId} as primary and ${config.secondaryModelId} as secondary.`);
}

// --- Getters for state ---
export function getActiveModelId() {
    return state.activeModelId;
}

export function getLLMEngine() {
    return state.llmEngine;
}

export function isModelLoaded(modelId) {
    if (modelId === config.primaryModelId) return !!state.primaryLlmEngine;
    if (modelId === config.secondaryModelId) return state.isSecondaryLoaded;
    return false;
}