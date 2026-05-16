import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailStore } from '../stores/email.store'
import { useSignatures } from '../hooks/useSignatures'
import { invoke } from '../lib/ipc'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { MilkdownEditor } from '../components/editor/MilkdownEditor'
import { EditorToolbar } from '../components/editor/EditorToolbar'

export default function Compose() {
  const navigate = useNavigate()
  const { accounts, selectedAccountId } = useEmailStore()
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const [form, setForm] = useState({
    accountId: selectedAccountId || '',
    to: '',
    subject: '',
    body: '',
  })

  const { signatures, getDefaultSignature } = useSignatures(form.accountId)
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('')

  // Set default signature
  useState(() => {
    const defaultSig = getDefaultSignature()
    if (defaultSig && !selectedSignatureId) {
      setSelectedSignatureId(defaultSig.id)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accountId || !form.to || !form.subject) return

    setSending(true)
    try {
      let finalBody = form.body
      if (selectedSignatureId) {
        const signature = signatures.find(s => s.id === selectedSignatureId)
        if (signature) {
          finalBody += `\n\n---\n${signature.contentHtml}`
        }
      }

      await invoke('email:send', {
        accountId: form.accountId,
        to: form.to.split(',').map((e) => e.trim()),
        subject: form.subject,
        body: finalBody,
      })
      navigate('/inbox')
    } catch (error) {
      alert(error instanceof Error ? error.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleInsertMarkdown = (markdown: string) => {
    setForm(prev => ({ ...prev, body: prev.body + markdown }))
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground">写邮件</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/inbox')}>取消</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={sending || !form.accountId || !form.to || !form.subject}
          >
            {sending ? '发送中...' : '发送'}
          </Button>
        </div>
      </header>

      <form className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-5">
          <div>
            <Label>发送账户</Label>
            <Select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              <SelectItem value="">选择邮箱账户</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.emailAddress}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Label>收件人</Label>
            <Input
              type="text"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label>主题</Label>
            <Input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="邮件主题"
            />
          </div>

          {signatures.length > 0 && (
            <div>
              <Label>签名</Label>
              <Select
                value={selectedSignatureId}
                onChange={(e) => setSelectedSignatureId(e.target.value)}
              >
                <SelectItem value="">不使用签名</SelectItem>
                {signatures.map((sig) => (
                  <SelectItem key={sig.id} value={sig.id}>
                    {sig.name} {sig.isDefault && '(默认)'}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="write">撰写</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="mt-3">
              <EditorToolbar
                onBold={() => handleInsertMarkdown('**粗体文本**')}
                onItalic={() => handleInsertMarkdown('*斜体文本*')}
                onStrikethrough={() => handleInsertMarkdown('~~删除线~~')}
                onHeading={(level) => handleInsertMarkdown(`${'#'.repeat(level)} 标题\n\n`)}
                onBulletList={() => handleInsertMarkdown('- 列表项\n')}
                onOrderedList={() => handleInsertMarkdown('1. 列表项\n')}
                onLink={() => handleInsertMarkdown('[链接文本](https://example.com)')}
                onQuote={() => handleInsertMarkdown('> 引用文本\n\n')}
                onCode={() => handleInsertMarkdown('`代码`')}
                onCodeBlock={() => handleInsertMarkdown('```\n代码块\n```\n')}
              />
              <div className="mt-2">
                <MilkdownEditor
                  value={form.body}
                  onChange={(value) => setForm({ ...form, body: value })}
                  placeholder="邮件内容（支持 Markdown）"
                  className="min-h-[300px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <div className="border border-border rounded-md p-4 min-h-[300px]">
                {form.body ? (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) }} />
                    {selectedSignatureId && (
                      <>
                        <hr className="my-4 border-border" />
                        <div
                          dangerouslySetInnerHTML={{
                            __html: signatures.find(s => s.id === selectedSignatureId)?.contentHtml || ''
                          }}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">预览将显示在这里...</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </div>
  )
}

function renderMarkdown(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/~~(.*)~~/gim, '<del>$1</del>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/gim, '<br />')
}
