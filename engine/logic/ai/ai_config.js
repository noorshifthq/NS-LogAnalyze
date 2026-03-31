// Model Identifiers
export const primaryModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"; // Qwen2.5-0.5B as the primary LLM
export const secondaryModelId = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Llama-3.2 as the secondary LLM

// Application Model Configuration
export const appConfig = {
    "model_list": [
        {
            "model_url": `https://huggingface.co/noorshifthq/${primaryModelId}/resolve/main/`,
            "model_id": primaryModelId,
            "local_id": `${primaryModelId}-custom`
        },
        {
            "model_url": `https://huggingface.co/noorshifthq/${secondaryModelId}/resolve/main/`,
            "model_id": secondaryModelId,
            "local_id": `${secondaryModelId}-custom`
        }
    ],
};

// Constants for the AI pipeline
export const SKIP_CLEANER_THRESHOLD = 2000; // If scouted logs are less than this, skip the cleaner pass.