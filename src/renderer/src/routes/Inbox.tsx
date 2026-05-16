import { useEffect, useState } from 'react'
import { useEmailStore } from '../stores/email.store'
import { format } from '../lib/utils'
import { invoke } from '../lib/ipc'
import { Button } from '../components/ui/button'
import type { Email } from '@shared/types/email.types'

function EmailListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
          <div className="h-4 w-3/4 bg-muted rounded mb-2" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}

export default function Inbox() {
  const { emails, isLoading, loadEmails, selectedEmailId, selectEmail } = useEmailStore()

  useEffect(() => {
    loadEmails()
  }, [loadEmails])

  return (
    <div className="h-full flex">
      {/* Email List */}
      <div className="w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">收件箱</h2>
          <button
            onClick={() => loadEmails()}
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="刷新"
          >
            🔄
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <EmailListSkeleton />
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">暂无邮件</p>
              <p className="text-xs mt-1">请先添加邮箱账户</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => selectEmail(email.id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-accent/50 ${
                    selectedEmailId === email.id ? 'bg-accent' : ''
                  } ${!email.isRead ? 'bg-primary/[0.03]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm ${!email.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {email.senderName || email.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format.date(email.receivedAt)}
                    </span>
                  </div>
                  <h3 className={`text-sm mb-1 truncate ${!email.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {email.subject}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                  {email.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {email.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-xs rounded"
                          style={{ backgroundColor: tag.color + '18', color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedEmailId ? (
          <EmailDetail emailId={selectedEmailId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-5xl mb-3">📧</p>
              <p className="text-sm">选择一封邮件查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmailDetail({ emailId }: { emailId: string }) {
  const [email, setEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEmail = async () => {
      setLoading(true)
      try {
        const emailData = await invoke<Email>('email:get', { emailId })
        setEmail(emailData)
      } catch (error) {
        console.error('Failed to load email:', error)
      }
      setLoading(false)
    }
    loadEmail()
  }, [emailId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">邮件未找到</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-foreground mb-4">{email.subject || '(无主题)'}</h1>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
            {(email.senderName || email.sender)[0].toUpperCase()}
          </div>
          <div>
            <p className="text-foreground font-medium text-sm">{email.senderName || email.sender}</p>
            <p className="text-xs text-muted-foreground">{email.sender}</p>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{format.date(email.receivedAt)}</span>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.bodyText || '' }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm">回复</Button>
        <Button variant="outline" size="sm">转发</Button>
        <Button variant="outline" size="sm">删除</Button>
      </div>
    </div>
  )
}
