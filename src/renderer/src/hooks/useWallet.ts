/**
 * useWallet Hook
 * 钱包连接和认证
 */

import { useCallback } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { invoke } from '../lib/ipc'
import type { AuthConnectResponse } from '@shared/types/wallet.types'

export function useWallet() {
  const { wallet, isConnected, isConnecting, error, setWallet, setConnecting, setError, disconnect } = useAuthStore()

  const connect = useCallback(async (walletType: 'metamask' | 'walletconnect' | 'coinbase') => {
    setConnecting(true)
    setError(null)

    try {
      const result = await invoke<AuthConnectResponse>('auth:connect', { walletType })
      setWallet({
        address: result.address,
        ensName: result.ensName,
        avatarUrl: result.avatarUrl,
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMessage)
      throw err
    }
  }, [setWallet, setConnecting, setError])

  const sign = useCallback(async (message: string, purpose: 'decrypt' | 'verify' | 'export') => {
    if (!isConnected) {
      throw new Error('No wallet connected')
    }

    try {
      const result = await invoke<{ signature: string }>('auth:sign', { message, purpose })
      return result.signature
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signing failed'
      setError(errorMessage)
      throw err
    }
  }, [isConnected, setError])

  const disconnectWallet = useCallback(async () => {
    try {
      await invoke('auth:disconnect')
      disconnect()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      setError(errorMessage)
      throw err
    }
  }, [disconnect, setError])

  return {
    wallet,
    isConnected,
    isConnecting,
    error,
    connect,
    sign,
    disconnect: disconnectWallet,
  }
}
