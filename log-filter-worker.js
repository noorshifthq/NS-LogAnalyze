// In a classic worker, we can't use `import`. Instead, we use `importScripts`
// to load the wasm-bindgen generated JS glue. This creates a global `wasm_bindgen`
// object.
importScripts('./pkg/rust-log-filter/rust_log_filter.js');

// The `wasm_bindgen` object is a function that returns a promise that
// resolves once the wasm is instantiated. The rust functions are attached
// to the `wasm_bindgen` object itself after the promise resolves.
const wasmReady = wasm_bindgen('./pkg/rust-log-filter/rust_log_filter_bg.wasm').catch(err => {
    console.error("Failed to initialize WASM module:", err);
    // Propagate the error, so the main thread knows something went wrong.
    throw err;
});

self.onmessage = async (event) => {
    // Ensure the WASM module is initialized before proceeding.
    await wasmReady;
    // The Rust functions are now available on the global `wasm_bindgen` object.
    // We can destructure it here for convenience.
    const { filter_logs_with_rust } = wasm_bindgen;

    const buffer = event.data;
    if (!buffer || buffer.byteLength === 0) {
        const emptyBuffer = new ArrayBuffer(0);
        self.postMessage(emptyBuffer, [emptyBuffer]);
        return;
    }

    const decoder = new TextDecoder();
    const logs = decoder.decode(buffer);

    // Call the exported Rust function to perform the filtering at near-native speed.
    const filteredLogs = filter_logs_with_rust(logs);

    const encoder = new TextEncoder();
    const outArray = encoder.encode(filteredLogs);
    self.postMessage(outArray.buffer, [outArray.buffer]);
};