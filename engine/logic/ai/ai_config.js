// Model Identifiers
export const primaryModelId = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC"; // Qwen2.5-0.5B as the primary LLM
export const secondaryModelId = "Llama-3.2-1B-Instruct-q4f32_1-MLC"; // Llama-3.2 as the secondary LLM

// Local Model Configuration
export const localAppConfig = {
    "model_list": [
        {
            "model_url": `engine/core/${primaryModelId}`,
            "local_id": `${primaryModelId}-local`,
           // "model_url": `engine/core/${primaryModelId}`,
          //  "local_id": `${primaryModelId}-local`,
            "model_url": `https://huggingface.co/mlc-ai/${primaryModelId}`,
            "model_id": primaryModelId
        },
        {
            //"model_url": `engine/core/${secondaryModelId}`,
           // "local_id": `${secondaryModelId}-local`,
            "model_url": `https://huggingface.co/mlc-ai/${secondaryModelId}`,
            "model_id": secondaryModelId
        }
    ],
};

// Constants for the AI pipeline
export const SKIP_CLEANER_THRESHOLD = 2000; // If scouted logs are less than this, skip the cleaner pass.