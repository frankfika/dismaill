import { useEffect, useState } from 'react'
import { useEmailStore } from '../stores/email.store'
import { format, sanitizeHtml } from '../lib/utils'
import { invoke } from '../lib/ipc'
import { Button } from '../components/ui/button'
import { RefreshCw, Inbox as InboxIcon, Mail, Trash2, Reply, Forward } from 'lucide-react'
import type { Email } from '@shared/types/email.types'

function EmailListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-3 animate-pulse rounded-md bg-muted/50">
          <div className="flex items-start justify-between mb-2">
            <div className="h-3.5 w-24 bg-muted-foreground/20 rounded" />
            <div className="h-3 w-12 bg-muted-foreground/20 rounded" />
          </div>
          <div className="h-3.5 w-3/4 bg-muted-foreground/20 rounded mb-1.5" />
          <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function Inbox() {
  const { emails, isLoading, loadEmails, selectedEmailId, selectEmail, accounts, selectedAccountId, selectAccount } = useEmailStore()

  useEffect(() => {
    loadEmails()
  }, [loadEmails, selectedAccountId])

  return (
    <div className="h-full flex bg-background">
      {/* Email List */}
      <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <InboxIcon size={16} />
            收件箱
          </h2>
          <div className="flex items-center gap-2">
            {/* Account selector */}
            {accounts.length > 1 && (
              <select
                value={selectedAccountId || ''}
                onChange={(e) => selectAccount(e.target.value || null)}
                className="text-xs rounded-md border border-border bg-background px-2 py-1"
              >
                <option value="">全部账户</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.emailAddress}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => loadEmails()}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="刷新"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <EmailListSkeleton />
          ) : emails.length === 0 ? (
            <div className="p-8 mt-10 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Mail size={18} className="text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium">暂无邮件</p>
              <p className="text-xs mt-1 opacity-70">请先添加邮箱账户</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={async () => {
                    selectEmail(email.id)
                    // Auto-mark as read when opening
                    if (!email.isRead) {
                      try {
                        await invoke('email:mark_read', { ids: [email.id], isRead: true })
                      } catch (err) {
                        console.error('Failed to mark as read:', err)
                      }
                    }
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors border-b border-border/50 ${
                    selectedEmailId === email.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-sm ${!email.isRead ? 'text-foreground font-semibold' : 'text-foreground/80 font-medium'}`}>
                      {email.senderName || email.sender}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0 ml-2">
                      {format.date(email.receivedAt)}
                    </span>
                  </div>
                  <h3 className={`text-sm mb-1 truncate ${!email.isRead ? 'text-foreground font-medium' : 'text-foreground/70'}`}>
                    {email.subject}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">{email.snippet}</p>
                  {email.tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {email.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                          style={{ backgroundColor: tag.color + '15', color: tag.color }}
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
      <div className="flex-1 overflow-y-auto bg-background">
        {selectedEmailId ? (
          <EmailDetail emailId={selectedEmailId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Mail size={20} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium">选择一封邮件查看详情</p>
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
    let cancelled = false
    const loadEmail = async () => {
      setLoading(true)
      try {
        const emailData = await invoke<Email>('email:get', { id: emailId })
        if (!cancelled) setEmail(emailData)
      } catch (error) {
        if (!cancelled) console.error('Failed to load email:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadEmail()
    return () => { cancelled = true }
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
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground mb-5 leading-snug">{email.subject || '(无主题)'}</h1>
        <div className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/40 border border-border">
          <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {(email.senderName || email.sender || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium text-sm">{email.senderName || email.sender}</p>
            <p className="text-xs text-muted-foreground truncate">{email.sender}</p>
          </div>
          <div className="text-xs text-muted-foreground font-medium shrink-0 bg-muted px-2.5 py-1 rounded">
            {format.date(email.receivedAt)}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div
          className="prose prose-p:text-foreground/80 prose-headings:text-foreground max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.bodyHtml || email.bodyText || '') }}
        />
      </div>

      {/* Action Bar */}
      <div className="mt-6 flex gap-2">
        <Button size="sm" className="rounded-md gap-1.5">
          <Reply size={14} />
          回复
        </Button>
        <Button variant="outline" size="sm" className="rounded-md gap-1.5">
          <Forward size={14} />
          转发
        </Button>
        <Button variant="outline" size="sm" className="rounded-md gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 size={14} />
          删除
        </Button>
      </div>
    </div>
  )
}
