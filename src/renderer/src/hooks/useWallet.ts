/**
 * useWallet Hook
 * 钱包连接和认证
 */
import { useCallback } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { invoke } from '../lib/ipc'
import type { AuthConnectResponse } from '@shared/types/wallet.types'

export function useWallet() {
  const { wallet, isConnected, isConnecting, error, setWallet, setConnecting, setError, disconnect } =
    useAuthStore()

  const connect = useCallback(
    async (params: {
      walletType: 'metamask' | 'walletconnect' | 'coinbase'
      address: string
      signature: string
      message: string
      ensName?: string
      avatarUrl?: string
    }) => {
      setConnecting(true)
      setError(null)
      try {
        const result = await invoke<AuthConnectResponse>('auth:connect', {
          walletType: params.walletType,
          address: params.address,
          signature: params.signature,
          message: params.message,
          ensName: params.ensName ?? null,
          avatarUrl: params.avatarUrl ?? null,
        })
        setWallet({
          address: result.address,
          ensName: result.ensName,
          avatarUrl: result.avatarUrl,
        })
        setConnecting(false)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed'
        setError(errorMessage)
        setConnecting(false)
        throw err
      }
    },
    [setWallet, setConnecting, setError],
  )

  const sign = useCallback(
    async (message: string, purpose: 'decrypt' | 'verify' | 'export') => {
      if (!isConnected) {
        throw new Error('No wallet connected')
      }
      try {
        const result = await invoke<{ signature: string; timestamp: number; nonce: string }>(
          'auth:sign',
          { message, purpose },
        )
        return result.signature
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Signing failed'
        setError(errorMessage)
        throw err
      }
    },
    [isConnected, setError],
  )

  const disconnectWallet = useCallback(async () => {
    try {
      await invoke('auth:disconnect')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      setError(errorMessage)
      throw err
    } finally {
      // Always clear local state regardless of backend result
      disconnect()
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
