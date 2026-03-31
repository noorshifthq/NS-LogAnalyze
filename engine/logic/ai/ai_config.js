import { prebuiltAppConfig } from 'https://esm.run/@mlc-ai/web-llm';

// Application Version (Increment this to force a model cache clear)
export const APP_VERSION = "1.0.3";

// Model Identifiers
export const primaryModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"; // Qwen2.5-0.5B as the primary LLM
export const secondaryModelId = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Llama-3.2 as the secondary LLM

// Base URL for the model repository
export const HF_BASE_URL = "https://huggingface.co/mlc-ai/";

// Application Model Configuration
export const appConfig = {
    "model_list": [
        {
            "model": `${HF_BASE_URL}${primaryModelId}/resolve/main/`,
            "model_url": `${HF_BASE_URL}${primaryModelId}/resolve/main/`,
            "model_id": primaryModelId,
            "model_lib": prebuiltAppConfig.model_list.find(m => m.model_id === primaryModelId)?.model_lib,
            "local_id": `${primaryModelId}-v${APP_VERSION}`
        },
        {
            "model": `${HF_BASE_URL}${secondaryModelId}/resolve/main/`,
            "model_url": `${HF_BASE_URL}${secondaryModelId}/resolve/main/`,
            "model_id": secondaryModelId,
            "model_lib": prebuiltAppConfig.model_list.find(m => m.model_id === secondaryModelId)?.model_lib,
            "local_id": `${secondaryModelId}-v${APP_VERSION}`
        }
    ],
};

// Constants for the AI pipeline
export const SKIP_CLEANER_THRESHOLD = 2000; // If scouted logs are less than this, skip the cleaner pass.