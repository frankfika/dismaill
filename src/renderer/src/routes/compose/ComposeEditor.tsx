import { Sparkles, Wand2, FileText } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectItem } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { MilkdownEditor } from '../../components/editor/MilkdownEditor'
import { EditorToolbar } from '../../components/editor/EditorToolbar'
import { sanitizeHtml } from '../../lib/utils'
import type { EmailAccount, ReplySkill, ReplyAgent } from '@shared/types'
import type { Signature } from '../../hooks/useSignatures'
import { AgentPicker } from './AgentPicker'
import { SkillPicker } from './SkillPicker'
import { renderMarkdown } from './markdown'

export interface ComposeEditorProps {
  // Form state
  form: { accountId: string; to: string; subject: string; body: string }
  onFormChange: (next: ComposeEditorProps['form']) => void
  // Selectors
  accounts: EmailAccount[]
  agents: ReplyAgent[]
  skills: ReplySkill[]
  signatures: Signature[]
  selectedAgentId: string
  selectedSkillId: string
  selectedSignatureId: string
  onAgentChange: (id: string) => void
  onSkillChange: (id: string) => void
  onSignatureChange: (id: string) => void
  // Tabs
  activeTab: 'write' | 'preview'
  onActiveTabChange: (tab: 'write' | 'preview') => void
  // AI panel toggle
  onToggleAIPanel: () => void
  showAIPanel: boolean
  // Selection metadata for header chip
  selectedAgent?: ReplyAgent
  selectedSkill?: ReplySkill
  // Header send button
  sending: boolean
  onCancel: () => void
  onSend: () => void
  sendError: string | null
}

export function ComposeEditor({
  form,
  onFormChange,
  accounts,
  agents,
  skills,
  signatures,
  selectedAgentId,
  selectedSkillId,
  selectedSignatureId,
  onAgentChange,
  onSkillChange,
  onSignatureChange,
  activeTab,
  onActiveTabChange,
  onToggleAIPanel,
  showAIPanel,
  selectedAgent,
  selectedSkill,
  sending,
  onCancel,
  onSend,
  sendError,
}: ComposeEditorProps) {
  const handleInsertMarkdown = (markdown: string) => {
    onFormChange({ ...form, body: form.body + markdown })
  }

  return (
    <>
      <header className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-border">
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <FileText size={16} />
          写邮件
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="rounded-md" onClick={onCancel}>
            取消
          </Button>
          <Button
            size="sm"
            className="rounded-md gap-1.5"
            onClick={onSend}
            disabled={sending || !form.accountId || !form.to || !form.subject}
          >
            {sending ? '发送中...' : '发送'}
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
          <form className="max-w-3xl mx-auto flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <FieldRow label="发件人">
                <Select
                  value={form.accountId}
                  onChange={(e) => onFormChange({ ...form, accountId: e.target.value })}
                >
                  <SelectItem value="">选择邮箱账户</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.emailAddress}
                    </SelectItem>
                  ))}
                </Select>
              </FieldRow>

              <FieldRow label="收件人">
                <Input
                  type="text"
                  value={form.to}
                  onChange={(e) => onFormChange({ ...form, to: e.target.value })}
                  placeholder="输入收件人邮箱..."
                  className="rounded-md"
                />
              </FieldRow>

              <FieldRow label="主题">
                <Input
                  type="text"
                  value={form.subject}
                  onChange={(e) => onFormChange({ ...form, subject: e.target.value })}
                  placeholder="邮件主题..."
                  className="rounded-md font-medium"
                />
              </FieldRow>

              <FieldRow label="角色" icon={<Sparkles size={11} />}>
                <div className="flex-1 flex items-center gap-2">
                  <AgentPicker
                    agents={agents}
                    selectedId={selectedAgentId}
                    onChange={onAgentChange}
                  />
                  {selectedAgent && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {selectedAgent.provider ? `${selectedAgent.provider} · ` : ''}
                      {selectedAgent.model || '默认模型'}
                    </span>
                  )}
                </div>
              </FieldRow>

              <FieldRow label="技能" icon={<Wand2 size={11} />}>
                <div className="flex-1 flex items-center gap-2">
                  <SkillPicker
                    skills={skills}
                    selectedId={selectedSkillId}
                    onChange={onSkillChange}
                  />
                  {selectedSkill && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {selectedSkill.examples.length} 示例 · 语气 {selectedSkill.tone}
                    </span>
                  )}
                </div>
              </FieldRow>

              {signatures.length > 0 && (
                <FieldRow label="签名">
                  <Select value={selectedSignatureId} onChange={(e) => onSignatureChange(e.target.value)}>
                    <SelectItem value="">不使用签名</SelectItem>
                    {signatures.map((sig) => (
                      <SelectItem key={sig.id} value={sig.id}>
                        {sig.name} {sig.isDefault && '(默认)'}
                      </SelectItem>
                    ))}
                  </Select>
                </FieldRow>
              )}
            </div>

            <div className="flex-1 border border-border rounded-lg flex flex-col overflow-hidden bg-card">
              <Tabs
                value={activeTab}
                onValueChange={(v) => onActiveTabChange(v as 'write' | 'preview')}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <TabsList className="bg-transparent h-8">
                    <TabsTrigger
                      value="write"
                      className="text-xs rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      撰写
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="text-xs rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      预览
                    </TabsTrigger>
                  </TabsList>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onToggleAIPanel}
                    className={`rounded-md gap-1.5 text-xs ${
                      showAIPanel ? 'bg-primary/10 text-primary border-primary/30' : ''
                    }`}
                  >
                    <Sparkles size={13} />
                    AI 助手
                    {selectedAgent && (
                      <span className="text-[10px] text-primary">· {selectedAgent.name}</span>
                    )}
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
                      onChange={(value) => onFormChange({ ...form, body: value })}
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
      </div>
    </>
  )
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-16 text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}
