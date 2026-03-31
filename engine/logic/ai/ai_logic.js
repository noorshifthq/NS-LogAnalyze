// This file serves as the main entry point for the AI logic module.
// It aggregates and exports all the necessary functions and constants
// from the other, more specialized AI modules. This allows `index.html`
// to have a single, clean import statement.

// AI Configuration
export {
    primaryModelId,
    secondaryModelId,
    localAppConfig,
    SKIP_CLEANER_THRESHOLD
} from './ai_config.js';

// AI State and Initialization
export {
    initAILogic,
    getActiveModelId,
    getLLMEngine,
    isModelLoaded
} from './ai_state.js';

// Core AI Engine Management
export {
    initializeLLMEngine,
    loadSecondaryInBackground,
    switchActiveModel
} from './ai_core.js';

// AI Analysis Tasks
export {
    cleanLogsWithLLM,
    getDeepAnalysisWithLLM
} from './ai_tasks.js';