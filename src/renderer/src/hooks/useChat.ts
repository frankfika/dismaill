import { useState, useEffect, useCallback } from 'react'
import { invoke } from '../lib/ipc'
import { useAuthStore } from '../stores/auth.store'

export interface ChatMessage {
  id: string
  senderAddress: string
  receiverAddress: string
  content: string
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
}

export interface Conversation {
  address: string
  ensName?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected } = useAuthStore()

  // Initialize chat service
  useEffect(() => {
    if (isConnected) {
      initializeChat()
    }
  }, [isConnected])

  const initializeChat = async () => {
    try {
      await invoke('chat:init')
    } catch (err) {
      console.error('Failed to initialize chat:', err)
    }
  }

  const fetchConversations = useCallback(async () => {
    if (!isConnected) {
      setConversations([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await invoke<Conversation[]>('chat:get_conversations')
      setConversations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
      console.error('Failed to fetch conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  const fetchMessages = useCallback(async (peerAddress: string) => {
    if (!isConnected || !peerAddress) {
      setMessages([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await invoke<ChatMessage[]>('chat:get_messages', { peerAddress })
      setMessages(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
      console.error('Failed to fetch messages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  const sendMessage = useCallback(async (peerAddress: string, content: string): Promise<boolean> => {
    if (!isConnected || !peerAddress || !content.trim()) return false

    setIsLoading(true)
    setError(null)

    try {
      await invoke('chat:send', { peerAddress, content })

      // Optimistically add message to local state
      const wallet = { address: '' } // Get from auth store
      const newMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        senderAddress: wallet.address,
        receiverAddress: peerAddress,
        content,
        timestamp: Date.now(),
        status: 'sent',
      }

      setMessages((prev) => [...prev, newMessage])

      // Refresh conversations to update last message
      await fetchConversations()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      console.error('Failed to send message:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, fetchConversations])

  const searchUser = useCallback(async (query: string): Promise<{ address: string; ensName?: string } | null> => {
    if (!query.trim()) return null

    // Simple validation for Ethereum address or ENS
    if (query.startsWith('0x') && query.length === 42) {
      return { address: query }
    }

    if (query.endsWith('.eth')) {
      return { address: '0x' + '1'.repeat(40), ensName: query }
    }

    return null
  }, [])

  return {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    searchUser,
  }
}
