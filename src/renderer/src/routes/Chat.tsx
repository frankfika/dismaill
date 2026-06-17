import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useChat } from '../hooks/useChat'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Search, MessageSquare, Send, Check, CheckCheck, Clock } from 'lucide-react'

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'sent': return <Clock size={10} className="opacity-60" />
    case 'delivered': return <Check size={10} />
    case 'read': return <CheckCheck size={10} />
    default: return null
  }
}

export default function Chat() {
  const { wallet } = useAuthStore()
  const {
    conversations,
    messages,
    isLoading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    searchUser,
  } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation, fetchMessages])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    const result = await searchUser(searchQuery)
    setIsSearching(false)
    if (result) {
      setSelectedConversation(result.address)
      setSearchQuery('')
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isLoading) return
    const success = await sendMessage(selectedConversation, messageInput)
    if (success) {
      setMessageInput('')
      await fetchMessages(selectedConversation)
    }
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString()
  }

  const truncateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`

  const selectedConvData = conversations.find(c => c.address === selectedConversation)

  return (
    <div className="h-full flex bg-background">
      <div className="w-[280px] shrink-0 border-r border-border bg-sidebar px-3 py-4">
        <div className="mb-4">
          <div className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2 mb-1">
            <MessageSquare size={15} />
            钱包聊天
          </div>
          <div className="text-[11px] text-sidebar-foreground/60">基于 XMTP 协议的私密沟通</div>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="搜索 ENS 或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 rounded-md border-border bg-background px-3 text-xs"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            size="sm"
            className="rounded-md px-2.5 h-8"
          >
            <Search size={13} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && conversations.length === 0 ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-sidebar-active/50" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center text-sm text-sidebar-foreground/50">
              <MessageSquare size={24} className="mb-3 text-sidebar-foreground/30" />
              <p className="font-medium text-sidebar-foreground/70">暂无对话</p>
              <p className="mt-1 text-[11px]">搜索 ENS 或钱包地址开始聊天</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.address}
                  onClick={() => setSelectedConversation(conv.address)}
                  className={`w-full rounded-md p-3 text-left transition-colors ${
                    selectedConversation === conv.address
                      ? 'bg-sidebar-active text-sidebar-foreground'
                      : 'hover:bg-sidebar-active/40 text-sidebar-foreground/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                        {(conv.ensName || conv.address).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {conv.ensName || truncateAddress(conv.address)}
                        </p>
                        <p className="truncate text-[11px] opacity-70">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] opacity-60">
                        {conv.lastMessageTime && formatTime(conv.lastMessageTime)}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="mt-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-6 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {(selectedConvData?.ensName || selectedConversation).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedConvData?.ensName || truncateAddress(selectedConversation)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {truncateAddress(selectedConversation)}
                </p>
              </div>
              <div className="ml-auto rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                encrypted
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-2/3 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.senderAddress === wallet?.address
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-3.5 py-2.5 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`mt-1.5 text-[10px] flex items-center gap-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(msg.timestamp)}
                            {isOwn && <StatusIcon status={msg.status} />}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border px-6 py-3">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="h-9 flex-1 rounded-md border-border bg-background px-4 text-sm shadow-none focus-visible:ring-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isLoading}
                  size="sm"
                  className="rounded-md px-4 h-9 gap-1.5"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center text-center">
              <MessageSquare size={32} className="mb-4 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">选择对话或搜索钱包地址</p>
              <p className="mt-1 text-xs text-muted-foreground">基于 XMTP 协议的端到端消息通道</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
