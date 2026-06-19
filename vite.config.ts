import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

const host = process.env.TAURI_DEV_HOST

// Vite config used by Tauri. Renderer source lives in src/renderer/, with the
// entry HTML at src/renderer/index.html and TS at src/renderer/src/main.tsx.
export default defineConfig(async () => ({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  // Tauri expects a fixed port and fails if it's not available.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Tell vite to ignore watching `src-tauri`.
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    base: './',
    // Produce sourcemaps in dev for easier debugging in WKWebView.
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Tauri targets modern webviews (Chromium 105+ / Safari 15+).
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
  },
}))
