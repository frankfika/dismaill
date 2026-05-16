import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { invokeWrapped } from '../lib/ipc'
import type { AuthConnectResponse } from '@shared/types/wallet.types'

interface Wallet {
  address: string
  ensName?: string
  avatarUrl?: string
}

interface AuthState {
  wallet: Wallet | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null

  // Actions for hooks
  setWallet: (wallet: Wallet | null) => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void

  // Actions
  connect: (walletType: 'metamask' | 'walletconnect' | 'coinbase') => Promise<void>
  disconnect: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      wallet: null,
      isConnected: false,
      isConnecting: false,
      error: null,

      // Actions for hooks
      setWallet: (wallet) => set({ wallet, isConnected: !!wallet }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      setError: (error) => set({ error }),

      connect: async (walletType) => {
        set({ isConnecting: true, error: null })
        try {
          const response = await invokeWrapped<AuthConnectResponse>('auth:connect', { walletType })

          if (response.success && response.data) {
            const data = response.data
            set({
              wallet: {
                address: data.address,
                ensName: data.ensName,
                avatarUrl: data.avatarUrl,
              },
              isConnected: true,
              isConnecting: false,
              error: null,
            })
          } else {
            set({
              isConnecting: false,
              error: response.error?.message || 'Connection failed',
            })
          }
        } catch (error) {
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          })
        }
      },

      disconnect: async () => {
        try {
          await invokeWrapped('auth:disconnect')
        } finally {
          set({
            wallet: null,
            isConnected: false,
            error: null,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'aura-auth-storage',
      partialize: (state) => ({ wallet: state.wallet, isConnected: state.isConnected }),
    }
  )
)
