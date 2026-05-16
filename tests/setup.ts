import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'
import type { IpcResponse } from '../src/shared/types/ipc.types'

// IPC handler store for tests
const ipcHandlers = new Map<string, (...args: unknown[]) => Promise<IpcResponse>>()

// Channels that should return arrays by default
const listChannels = new Set(['account:list', 'email:list', 'tag:list', 'signature:list'])

// Mock window.aura (the preload bridge)
const mockAura = {
  invoke: vi.fn(async (channel: string, ...args: unknown[]): Promise<IpcResponse> => {
    const handler = ipcHandlers.get(channel)
    if (handler) {
      return handler(...args)
    }
    // Return array for list endpoints, object otherwise
    return { success: true, data: listChannels.has(channel) ? [] : {} }
  }),
  on: vi.fn((_channel: string, _callback: (...args: unknown[]) => void) => {
    return () => {} // unsubscribe
  }),
  platform: 'darwin' as NodeJS.Platform,
  versions: {
    node: '20.0.0',
    chrome: '120.0.0',
    electron: '32.0.0',
  },
}

// Only set up browser globals when running in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'aura', {
    writable: true,
    value: mockAura,
  })

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
  // Re-assign default mock after clearAllMocks
  mockAura.invoke.mockImplementation(async (channel: string, ...args: unknown[]): Promise<IpcResponse> => {
    const handler = ipcHandlers.get(channel)
    if (handler) {
      return handler(...args)
    }
    return { success: true, data: listChannels.has(channel) ? [] : {} }
  })
})

// Export helpers for tests
export { mockAura, ipcHandlers }

export const registerIpcHandler = (channel: string, handler: (...args: unknown[]) => Promise<IpcResponse>) => {
  ipcHandlers.set(channel, handler)
}

export const clearIpcHandlers = () => {
  ipcHandlers.clear()
}
