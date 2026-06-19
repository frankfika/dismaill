/// <reference types="vite/client" />

interface Window {
  // Tauri injects __TAURI_INTERNALS__ at runtime
  __TAURI_INTERNALS__?: {
    invoke: (command: string, payload?: Record<string, unknown>) => Promise<unknown>
    transformCallback: (callback: (response: unknown) => void) => number
  }
}
