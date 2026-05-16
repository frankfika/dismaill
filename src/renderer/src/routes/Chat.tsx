import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useChat } from '../hooks/useChat'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

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
    if (!messageInput.trim() || !selectedConversation) return
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
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-medium text-foreground mb-3">钱包聊天</h2>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="搜索 ENS 或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-sm"
            />
            <Button onClick={handleSearch} disabled={isSearching} size="sm">
              {isSearching ? '...' : '搜索'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && conversations.length === 0 ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <p>暂无对话</p>
              <p className="text-xs mt-1">搜索 ENS 或钱包地址开始聊天</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.address}
                onClick={() => setSelectedConversation(conv.address)}
                className={`p-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                  selectedConversation === conv.address ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                      {(conv.ensName || conv.address).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.ensName || truncateAddress(conv.address)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {conv.lastMessageTime && formatTime(conv.lastMessageTime)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {(selectedConvData?.ensName || selectedConversation).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedConvData?.ensName || truncateAddress(selectedConversation)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {truncateAddress(selectedConversation)}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-3/4 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderAddress === wallet?.address
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatTime(msg.timestamp)}
                          {isOwn && (
                            <span className="ml-1.5">
                              {msg.status === 'sent' && '○'}
                              {msg.status === 'delivered' && '✓'}
                              {msg.status === 'read' && '✓✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim() || isLoading}>
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">选择对话或搜索钱包地址</p>
              <p className="text-xs mt-1">基于 XMTP 协议</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
