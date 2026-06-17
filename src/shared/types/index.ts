// Export all types
export * from './ipc.types'
export * from './wallet.types'
export * from './email.types'
export * from './ai.types'
export * from './skill.types'
export * from './agent.types'

// Tag Types
export interface Tag {
  id: string
  walletAddress: string
  name: string
  color: string
  description?: string
  isAiEnabled: boolean
  emailCount: number
  createdAt: string
  updatedAt: string
}
