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
  const { isConnected, wallet } = useAuthStore()

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

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = useCallback(
    async (peerAddress: string) => {
      if (!isConnected || !peerAddress) {
        setMessages([])
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const result = await invoke<ChatMessage[]>('chat:get_messages', {
          conversationId: null,
          peerAddress,
          limit: 50,
        })
        setMessages(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages')
        console.error('Failed to fetch messages:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected],
  )

  const sendMessage = useCallback(
    async (peerAddress: string, content: string): Promise<boolean> => {
      if (!isConnected || !peerAddress || !content.trim() || !wallet?.address) return false
      const tempId = `temp-${Date.now()}`
      const optimisticMsg: ChatMessage = {
        id: tempId,
        senderAddress: wallet.address,
        receiverAddress: peerAddress,
        content,
        timestamp: Date.now(),
        status: 'sent',
      }
      setMessages((prev) => [...prev, optimisticMsg])
      setIsLoading(true)
      setError(null)
      try {
        await invoke('chat:send', { conversationId: null, peerAddress, content })
        await fetchConversations()
        return true
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        setError(err instanceof Error ? err.message : 'Failed to send message')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isConnected, fetchConversations, wallet?.address],
  )

  const searchUser = useCallback(
    async (query: string): Promise<{ address: string; ensName?: string } | null> => {
      if (!query.trim()) return null
      if (query.startsWith('0x') && query.length === 42) {
        return { address: query }
      }
      if (query.endsWith('.eth')) {
        return { address: '0x' + '1'.repeat(40), ensName: query }
      }
      return null
    },
    [],
  )

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
