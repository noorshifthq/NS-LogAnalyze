use wasm_bindgen::prelude::*;
use regex::Regex;
use once_cell::sync::Lazy;

/// This function is exported to JavaScript and can be called from the worker.
/// It implements a "sticky" filtering logic to extract error-related snippets from logs.
#[wasm_bindgen]
pub fn filter_logs_with_rust(logs: &str) -> String {
    // Regex to identify lines that indicate the start of an error or a significant event.
    // This is the "trigger" for our "sticky" logic.
    // Case-insensitive search for common keywords, using word boundaries to avoid partial matches.
    static ERROR_START_REGEX: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?i)\b(error|exception|failed|panic|fatal|unhandled|uncaught|traceback)\b").unwrap()
    });
    
    // Regex to identify lines that are likely part of a stack trace or continuation.
    // These often start with whitespace (e.g., indented stack traces) or are part of a known pattern.
    static CONTINUATION_REGEX: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"^\s+at\s|^\s{2,}|^\t|Caused by:").unwrap()
    });

    let mut snippets: Vec<String> = Vec::new();
    let mut current_snippet: Vec<&str> = Vec::new();

    for line in logs.lines() {
        if ERROR_START_REGEX.is_match(line) {
            // A new error is starting.
            // First, save the previous snippet if it exists.
            if !current_snippet.is_empty() {
                snippets.push(current_snippet.join("\n"));
            }
            // Start a new snippet with the current line.
            current_snippet = vec![line];
        } else if !current_snippet.is_empty() {
            // We are currently inside a snippet.
            if CONTINUATION_REGEX.is_match(line) || line.trim().is_empty() {
                // This line is a continuation of the current error.
                current_snippet.push(line);
            } else {
                // This line is not a continuation, so the snippet ends here.
                snippets.push(current_snippet.join("\n"));
                current_snippet.clear();
            }
        }
    }

    // Add the last snippet if it exists.
    if !current_snippet.is_empty() {
        snippets.push(current_snippet.join("\n"));
    }

    snippets.join("\n\n---\n\n")
}