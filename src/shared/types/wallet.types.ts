// Wallet Types
export interface Wallet {
  address: string
  ensName: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface AuthConnectRequest {
  walletType: 'metamask' | 'walletconnect' | 'coinbase'
}

export interface AuthConnectResponse {
  address: string
  ensName?: string
  avatarUrl?: string
  isNewUser: boolean
}

export interface AuthSignRequest {
  message: string
  purpose: 'decrypt' | 'verify' | 'export'
}

export interface AuthSignResponse {
  signature: string
  timestamp?: number
  nonce?: string
}
