import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'
import type { IpcResponse } from '../src/shared/types/ipc.types'

// IPC handler store for tests
const ipcHandlers = new Map<string, (...args: unknown[]) => Promise<IpcResponse>>()

// Channels that should return arrays by default
const listChannels = new Set(['account:list', 'email:list', 'tag:list', 'signature:list'])

// Mock @tauri-apps/api/core invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (command: string, payload?: unknown) => {
    // Map Tauri command names back to frontend channel names for handler lookup
    const channel = command.replace(/_/g, ':')
    const handler = ipcHandlers.get(channel)
    if (handler) {
      const response = await handler(channel, payload)
      if (response.success) {
        return response.data
      }
      throw new Error(response.error?.message || response.error?.code || 'Invoke error')
    }
    // Return array for list endpoints, object otherwise
    return listChannels.has(channel) ? [] : {}
  }),
}))

// Only set up browser globals when running in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock localStorage for zustand persist
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
      get length() { return Object.keys(store).length },
      key: (i: number) => Object.keys(store)[i] || null,
    }
  })()

  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
  ipcHandlers.clear()
})

// Export helpers for tests
export { ipcHandlers }

export const registerIpcHandler = (channel: string, handler: (...args: unknown[]) => Promise<IpcResponse>) => {
  ipcHandlers.set(channel, handler)
}

export const clearIpcHandlers = () => {
  ipcHandlers.clear()
}
