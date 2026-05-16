import { vi } from 'vitest'
import type { IpcResponse } from '../../src/shared/types/ipc.types'

// Create a store for IPC handlers
const ipcHandlers = new Map<string, Function>()

// Mock IPC Renderer
export const mockIpcRenderer = {
  invoke: vi.fn(async (channel: string, ...args: unknown[]): Promise<IpcResponse> => {
    const handler = ipcHandlers.get(channel)
    if (handler) {
      return handler(...args)
    }
    return { success: false, error: { code: 'UNKNOWN_CHANNEL', message: `No handler for ${channel}` } }
  }),

  on: vi.fn((channel: string, callback: Function) => {
    return () => {}
  }),

  off: vi.fn(),

  send: vi.fn(),
}

// Mock IPC Main
export const mockIpcMain = {
  handle: vi.fn((channel: string, handler: Function) => {
    ipcHandlers.set(channel, handler)
  }),

  removeHandler: vi.fn((channel: string) => {
    ipcHandlers.delete(channel)
  }),

  on: vi.fn(),
}

// Register IPC Handler for testing
export const registerIpcHandler = (channel: string, handler: Function) => {
  ipcHandlers.set(channel, handler)
}

// Clear all handlers
export const clearIpcHandlers = () => {
  ipcHandlers.clear()
}

// Mock contextBridge
export const mockContextBridge = {
  exposeInMainWorld: vi.fn(),
}

// Setup Electron mock
export const setupElectronMock = () => {
  vi.stubGlobal('electron', {
    ipcRenderer: mockIpcRenderer,
    ipcMain: mockIpcMain,
    contextBridge: mockContextBridge,
  })
}

// Cleanup
export const cleanupElectronMock = () => {
  clearIpcHandlers()
  vi.unstubAllGlobals()
}
