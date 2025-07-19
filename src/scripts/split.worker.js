// Message Contract (v1.1):
// From Main to Worker: { file: File, splitHeight: number }
// From Worker to Main:
// - Progress: { type: 'progress', progress: number } // 0-100 percentage
// - Chunk:    { type: 'chunk', blob: Blob, index: number }
// - Done:     { type: 'done' } // Simplified completion signal
// - Error:    { type: 'error', message: string }

// Web Worker for handling image splitting operations
// This worker runs in a separate thread to avoid blocking the UI 