/**
 * IPC 调用封装 (Tauri)
 * 渲染进程通过此模块调用 Tauri 后端 commands
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import type { IpcResponse } from '@shared/types/ipc.types'
import type { IpcChannel } from '@shared/types/ipc.types'

/**
 * 将前端 channel 名 (如 auth:connect) 映射为 Tauri command 名 (如 auth_connect)
 */
function mapChannel(channel: IpcChannel): string {
  return channel.replace(/:/g, '_')
}

/**
 * 调用 IPC 并处理响应
 * Tauri command 直接返回数据，我们将其包装为前端期望的 IpcResponse 格式
 */
export async function invoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
  const command = mapChannel(channel)

  try {
    // Tauri invoke 接受一个 payload 对象
    const payload =
      args.length > 0 && args[0] !== null && typeof args[0] === 'object'
        ? (args[0] as Record<string, unknown>)
        : {}
    const result = await tauriInvoke<T>(command, payload)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(message)
  }
}

/**
 * 调用 IPC 并返回包装后的响应（兼容旧版 IpcResponse 格式）
 */
export async function invokeWrapped<T>(channel: IpcChannel, ...args: unknown[]): Promise<IpcResponse<T>> {
  try {
    const data = await invoke<T>(channel, ...args)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: { code: 'INVOKE_ERROR', message } }
  }
}

/**
 * 监听 IPC 事件 (Tauri 中通过 events 实现)
 */
export function on(channel: string, _callback: (...args: unknown[]) => void): () => void {
  // TODO: 如果需要 Tauri events，使用 @tauri-apps/api/event 的 listen
  console.warn(`Event listening not yet implemented for channel: ${channel}`)
  return () => {}
}

/**
 * 获取平台信息
 */
export function getPlatform(): string {
  // Tauri 中通过 @tauri-apps/api/os 获取
  return navigator.platform
}
