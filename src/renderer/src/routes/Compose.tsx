import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmailStore } from '../stores/email.store'
import { useSignatures } from '../hooks/useSignatures'
import { useSkills } from '../hooks/useSkills'
import { useAgents } from '../hooks/useAgents'
import { invoke } from '../lib/ipc'
import { sanitizeHtml } from '../lib/utils'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { MilkdownEditor } from '../components/editor/MilkdownEditor'
import { EditorToolbar } from '../components/editor/EditorToolbar'
import {
  Send,
  X,
  Sparkles,
  FileText,
  Wand2,
  ChevronDown,
  Info,
  Loader2,
  Check,
  Briefcase,
  MessageCircle,
  Phone,
  Megaphone,
  Shield,
  Heart,
  Book,
  Beaker,
} from 'lucide-react'
import type { ReplySkill } from '@shared/types/skill.types'
import type { AgentIcon, ReplyAgent } from '@shared/types/agent.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AGENT_ICONS: Record<AgentIcon, React.ComponentType<any>> = {
  wand: Wand2,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  phone: Phone,
  megaphone: Megaphone,
  shield: Shield,
  heart: Heart,
  sparkles: Sparkles,
  book: Book,
  flask: Beaker,
}

export default function Compose() {
  const navigate = useNavigate()
  const { accounts, selectedAccountId } = useEmailStore()
  const { skills } = useSkills()
  const { agents, recordUse: recordAgentUse } = useAgents()
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selectedSkillId, setSelectedSkillId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const [form, setForm] = useState({
    accountId: selectedAccountId || '',
    to: '',
    subject: '',
    body: '',
  })
  const [debouncedSubject, setDebouncedSubject] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSubject(form.subject), 300)
    return () => clearTimeout(t)
  }, [form.subject])

  const { signatures, getDefaultSignature } = useSignatures(form.accountId)
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('')

  useEffect(() => {
    const defaultSig = getDefaultSignature()
    setSelectedSignatureId(defaultSig?.id || '')
  }, [form.accountId, getDefaultSignature])

  // Auto-pick a matching agent (then a matching skill) from the subject.
  // Looks for any of the agent's / skill's trigger categories in the
  // subject text. Uses a debounced subject to avoid running on every keystroke.
  useEffect(() => {
    if (!debouncedSubject) return
    const subj = debouncedSubject.toLowerCase()
    if (agents.length > 0 && !selectedAgentId) {
      const match = agents.find((a) =>
        a.triggerCategories.some((c) => subj.includes(c.toLowerCase())),
      )
      if (match) {
        setSelectedAgentId(match.id)
        if (!selectedSkillId && match.defaultSkillId) {
          setSelectedSkillId(match.defaultSkillId)
        }
        return
      }
    }
    if (skills.length > 0 && !selectedSkillId) {
      const match = skills.find((s) =>
        s.triggerCategories.some((c) => subj.includes(c.toLowerCase())),
      )
      if (match) setSelectedSkillId(match.id)
    }
  }, [debouncedSubject, agents, skills, selectedAgentId, selectedSkillId])

  const selectedAgent: ReplyAgent | undefined = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId],
  )
  const selectedSkill: ReplySkill | undefined = useMemo(
    () => skills.find((s) => s.id === selectedSkillId),
    [skills, selectedSkillId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accountId || !form.to || !form.subject) return

    setSending(true)
    setSendError(null)
    try {
      let finalBody = form.body
      if (selectedSignatureId) {
        const signature = signatures.find((s) => s.id === selectedSignatureId)
        if (signature) {
          finalBody += `\n\n---\n${signature.contentHtml}`
        }
      }

      await invoke('email:send', {
        accountId: form.accountId,
        to: form.to.split(',').map((s) => s.trim()),
        cc: null,
        bcc: null,
        subject: form.subject,
        body: finalBody,
        bodyHtml: null,
        signatureId: selectedSignatureId || null,
        replyTo: null,
        attachments: null,
      })

      // Record usage analytics.
      if (selectedAgent) {
        recordAgentUse(selectedAgent.id)
      }
      if (selectedSkill) {
        try { await invoke('skill:incr_use', { id: selectedSkill.id }) } catch { /* analytics best-effort */ }
      }
      navigate('/inbox')
    } catch (error) {
      setSendError(error instanceof Error ? error.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleInsertMarkdown = (markdown: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + markdown }))
  }

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return
    setIsGenerating(true)
    setAiError(null)
    try {
      const resp = await invoke<{ content: string; tokensUsed: number; provider: string }>(
        'ai:generate',
        {
          prompt: aiInput,
          agentId: selectedAgentId || null,
          templateId: null,
          context: null,
          provider: null,
          model: null,
          maxTokens: null,
          stream: null,
          requestId: null,
          skill: selectedSkill ?? null,
        },
      )
      setForm((prev) => ({ ...prev, body: prev.body + (prev.body ? '\n\n' : '') + resp.content }))
      setAiInput('')
      setShowAIPanel(false)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-border">
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <FileText size={16} />
          写邮件
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="rounded-md" onClick={() => navigate('/inbox')}>
            <X size={14} className="mr-1" />
            取消
          </Button>
          <Button
            size="sm"
            className="rounded-md gap-1.5"
            onClick={handleSubmit}
            disabled={sending || !form.accountId || !form.to || !form.subject}
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send size={14} />
                发送
              </>
            )}
          </Button>
        </div>
        {sendError && (
          <div className="px-6 py-2 border-b border-destructive/20 bg-destructive/10 text-xs text-destructive">
            {sendError}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form className="max-w-3xl mx-auto flex flex-col gap-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0">发件人</Label>
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

              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0">收件人</Label>
                <Input
                  type="text"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  placeholder="输入收件人邮箱..."
                  className="rounded-md"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0">主题</Label>
                <Input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="邮件主题..."
                  className="rounded-md font-medium"
                />
              </div>

              {/* Agent + Skill pickers */}
              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
                  <Sparkles size={11} />
                  角色
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <AgentPicker
                    agents={agents}
                    selectedId={selectedAgentId}
                    onChange={setSelectedAgentId}
                  />
                  {selectedAgent && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {selectedAgent.provider ? `${selectedAgent.provider} · ` : ''}
                      {selectedAgent.model || '默认模型'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
                  <Wand2 size={11} />
                  技能
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <SkillPicker
                    skills={skills}
                    selectedId={selectedSkillId}
                    onChange={setSelectedSkillId}
                  />
                  {selectedSkill && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {selectedSkill.examples.length} 示例 · 语气 {selectedSkill.tone}
                    </span>
                  )}
                </div>
              </div>

              {signatures.length > 0 && (
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0">签名</Label>
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
            </div>

            <div className="flex-1 border border-border rounded-lg flex flex-col overflow-hidden bg-card">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger value="write" className="text-xs rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">撰写</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">预览</TabsTrigger>
                  </TabsList>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className={`rounded-md gap-1.5 text-xs ${showAIPanel ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                  >
                    <Sparkles size={13} />
                    AI 助手
                    {selectedAgent && <span className="text-[10px] text-primary">· {selectedAgent.name}</span>}
                  </Button>
                </div>

                <TabsContent value="write" className="flex-1 flex flex-col m-0">
                  <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
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
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <MilkdownEditor
                      value={form.body}
                      onChange={(value) => setForm({ ...form, body: value })}
                      placeholder="输入邮件内容，或点击右上角使用 AI 助手..."
                      className="min-h-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 p-6 overflow-y-auto m-0">
                  {form.body ? (
                    <div className="prose prose-p:text-foreground/80 prose-headings:text-foreground max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) }} />
                      {selectedSignatureId && (
                        <>
                          <hr className="my-6 border-border" />
                          <div
                            className="opacity-80"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(
                                signatures.find((s) => s.id === selectedSignatureId)?.contentHtml || '',
                              ),
                            }}
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground/50">
                      <p>预览将显示在这里...</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </form>
        </div>

        {showAIPanel && (
          <div className="w-[320px] border-l border-border bg-card flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-sm font-medium text-foreground">AI Copilot</span>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-5">
              {(selectedAgent || selectedSkill) ? (
                <div className="space-y-2">
                  {selectedAgent && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = AGENT_ICONS[selectedAgent.icon] || Wand2
                          return <Icon size={13} className="text-primary" />
                        })()}
                        <span className="text-xs font-medium text-primary">
                          角色：{selectedAgent.name}
                        </span>
                      </div>
                      {selectedAgent.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {selectedAgent.description}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedSkill && (
                    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Wand2 size={12} className="text-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          技能：{selectedSkill.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground">
                          {selectedSkill.tone}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground">
                          {selectedSkill.examples.length} 示例
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : agents.length > 0 || skills.length > 0 ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  <span>从上方"角色"或"技能"下拉中选择，AI 会按训练好的风格生成</span>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                  还没有任何角色或技能。前往
                  <a href="#/settings" className="text-primary hover:underline mx-0.5">设置</a>
                  创建。
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  补充提示
                </Label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="例如：告诉他会按时提交报告，并表达对延期的小歉意..."
                  className="w-full h-32 p-3 text-xs bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {aiError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {aiError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20">
              <Button
                type="button"
                className="w-full rounded-md gap-1.5"
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiInput.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    生成草稿
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentPicker({
  agents,
  selectedId,
  onChange,
}: {
  agents: ReplyAgent[]
  selectedId: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = agents.find((a) => a.id === selectedId)
  const SelectedIcon = selected ? AGENT_ICONS[selected.icon] || Wand2 : null
  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/30"
      >
        <span className="flex items-center gap-2 truncate">
          {selected && SelectedIcon ? (
            <>
              <SelectedIcon size={12} className="text-primary" />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">不指定角色（用通用 AI）</span>
          )}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b border-border"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">不指定角色</span>
              {!selectedId && <Check size={12} className="text-primary ml-auto" />}
            </div>
          </button>
          {agents.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              还没有角色。前往设置 → AI 角色 创建。
            </div>
          )}
          {agents.map((a) => {
            const Icon = AGENT_ICONS[a.icon] || Wand2
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onChange(a.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b border-border/50 ${
                  selectedId === a.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={12} className="text-primary shrink-0" />
                  <span className="font-medium truncate">{a.name}</span>
                  {a.model && (
                    <span className="text-[10px] text-muted-foreground shrink-0">· {a.model}</span>
                  )}
                  {selectedId === a.id && <Check size={12} className="text-primary ml-auto" />}
                </div>
                {a.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {a.description}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SkillPicker({
  skills,
  selectedId,
  onChange,
}: {
  skills: ReplySkill[]
  selectedId: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = skills.find((s) => s.id === selectedId)
  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/30"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <Wand2 size={12} className="text-primary" />
              <span className="truncate">{selected.name}</span>
              <span className="text-[10px] text-muted-foreground">· {selected.tone}</span>
            </>
          ) : (
            <span className="text-muted-foreground">不指定技能（用通用 AI）</span>
          )}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b border-border"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">不指定技能</span>
              {!selectedId && <Check size={12} className="text-primary ml-auto" />}
            </div>
          </button>
          {skills.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              还没有技能。前往设置 → 回复技能 创建。
            </div>
          )}
          {skills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange(s.id)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b border-border/50 ${
                selectedId === s.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Wand2 size={12} className="text-primary shrink-0" />
                <span className="font-medium truncate">{s.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">· {s.tone}</span>
                {selectedId === s.id && <Check size={12} className="text-primary ml-auto" />}
              </div>
              {s.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function renderMarkdown(markdown: string): string {
  const html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(.*?)\*(?!\*)/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/gim, '<br />')
  return sanitizeHtml(html)
}
