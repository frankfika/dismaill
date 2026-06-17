import { useEffect, useState } from 'react'
import { useAgents } from '../../hooks/useAgents'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useDialogDismiss } from '../../hooks/useDialogDismiss'
import {
  AGENT_ICON_PRESETS,
  STARTER_AGENTS,
  type AgentIcon,
  type CreateReplyAgentInput,
  type ReplyAgent,
  type UpdateReplyAgentInput,
} from '@shared/types/agent.types'
import type { ReplySkill } from '@shared/types/skill.types'
import { Sparkles, Plus, Copy, Pencil, Trash2, X, Wand2 } from 'lucide-react'
import { AGENT_ICONS } from './constants'

export function AgentsSettings() {
  const { agents, isLoading, createAgent, deleteAgent } = useAgents()
  const { skills } = useSkills()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState<ReplyAgent | null>(null)
  const [duplicating, setDuplicating] = useState<ReplyAgent | null>(null)

  const handleAddStarter = async (preset: CreateReplyAgentInput) => {
    const created = await createAgent(preset)
    if (created) setShowAddModal(false)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            AI 角色
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            不同来信用不同人设回复。客户支持 / 销售 / 法务 / 私人 / …
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setDuplicating(null)
            setShowAddModal(true)
          }}
          className="rounded-md gap-1.5"
        >
          <Plus size={14} />
          新建角色
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中…</div>
      ) : agents.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-10 text-center text-muted-foreground">
            <Sparkles size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm">还没有任何角色</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              从下面安装一个预设，或新建你自己的
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
              推荐起点
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STARTER_AGENTS.map((preset) => {
                const Icon = AGENT_ICONS[preset.icon ?? 'wand']
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleAddStarter(preset)}
                    className="text-left rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{preset.name}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {agents.map((agent) => {
            const Icon = AGENT_ICONS[agent.icon] || Wand2
            return (
              <div
                key={agent.id}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {agent.name}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </div>

                {agent.triggerCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.triggerCategories.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {agent.provider ? `${agent.provider} · ` : ''}
                    {agent.model || '默认模型'} · 已用 {agent.useCount} 次
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setDuplicating(agent)
                        setEditing(null)
                        setShowAddModal(true)
                      }}
                      className="rounded p-1 hover:bg-muted"
                      title="复制"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(agent)
                        setDuplicating(null)
                        setShowAddModal(true)
                      }}
                      className="rounded p-1 hover:bg-muted"
                      title="编辑"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定删除「${agent.name}」？`)) deleteAgent(agent.id)
                      }}
                      className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AgentEditorModal
          initial={
            editing
              ? ({
                  id: editing.id,
                  name: editing.name,
                  description: editing.description,
                  icon: editing.icon,
                  systemPrompt: editing.systemPrompt,
                  provider: editing.provider,
                  model: editing.model,
                  temperature: editing.temperature,
                  maxTokens: editing.maxTokens,
                  defaultSkillId: editing.defaultSkillId,
                  triggerCategories: editing.triggerCategories,
                } as UpdateReplyAgentInput)
              : duplicating
              ? ({
                  name: duplicating.name + ' (副本)',
                  description: duplicating.description,
                  icon: duplicating.icon,
                  systemPrompt: duplicating.systemPrompt,
                  provider: duplicating.provider,
                  model: duplicating.model,
                  temperature: duplicating.temperature,
                  maxTokens: duplicating.maxTokens,
                  defaultSkillId: duplicating.defaultSkillId,
                  triggerCategories: duplicating.triggerCategories,
                } as UpdateReplyAgentInput)
              : undefined
          }
          availableSkills={skills}
          onClose={() => {
            setShowAddModal(false)
            setEditing(null)
            setDuplicating(null)
          }}
        />
      )}
    </div>
  )
}

export function AgentEditorModal({
  initial,
  availableSkills,
  onClose,
}: {
  initial?: UpdateReplyAgentInput
  availableSkills: ReplySkill[]
  onClose: () => void
}) {
  const dialogRef = useDialogDismiss(onClose, true)
  const { updateAgent, createAgent } = useAgents()
  const isEdit = !!initial?.id
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState<AgentIcon>((initial?.icon as AgentIcon) ?? 'wand')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const [provider, setProvider] = useState(initial?.provider ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [temperature, setTemperature] = useState(initial?.temperature ?? 0.7)
  const [maxTokens, setMaxTokens] = useState(initial?.maxTokens ?? 2000)
  const [defaultSkillId, setDefaultSkillId] = useState(initial?.defaultSkillId ?? '')
  const [categories, setCategories] = useState((initial?.triggerCategories ?? []).join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setIcon((initial?.icon as AgentIcon) ?? 'wand')
    setSystemPrompt(initial?.systemPrompt ?? '')
    setProvider(initial?.provider ?? '')
    setModel(initial?.model ?? '')
    setTemperature(initial?.temperature ?? 0.7)
    setMaxTokens(initial?.maxTokens ?? 2000)
    setDefaultSkillId(initial?.defaultSkillId ?? '')
    setCategories((initial?.triggerCategories ?? []).join(', '))
    setError(null)
  }, [initial])

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      setError('请填写名称和系统提示')
      return
    }
    const cats = categories.split(',').map((s) => s.trim()).filter(Boolean)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      icon,
      systemPrompt: systemPrompt.trim(),
      provider: provider.trim() || null,
      model: model.trim() || null,
      temperature,
      maxTokens,
      defaultSkillId: defaultSkillId || null,
      triggerCategories: cats,
    }
    setSubmitting(true)
    setError(null)
    if (isEdit && initial?.id) {
      const result = await updateAgent({ id: initial.id, ...payload })
      setSubmitting(false)
      if (result) onClose()
      else setError('更新失败')
    } else {
      const result = await createAgent(payload)
      setSubmitting(false)
      if (result) onClose()
      else setError('创建失败')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-editor-title"
      tabIndex={-1}
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h3 id="agent-editor-title" className="text-base font-semibold text-foreground">
            {isEdit ? '编辑角色' : '新建角色'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">角色名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：客户支持、销售拓展…"
                className="rounded-md mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">图标</Label>
              <div className="mt-1 grid grid-cols-5 gap-1">
                {AGENT_ICON_PRESETS.map((p) => {
                  const Icon = AGENT_ICONS[p.value]
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setIcon(p.value)}
                      className={`h-8 rounded-md flex items-center justify-center transition-colors ${
                        icon === p.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                      }`}
                      title={p.label}
                    >
                      <Icon size={14} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">描述</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句话说清这个角色适合什么场景"
              className="rounded-md mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">系统提示（核心人设）</Label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="告诉 AI 它是谁、要遵守什么原则、避免什么…"
              rows={5}
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Provider（留空 = 全局默认）</Label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">默认</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Model</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o, claude-3-sonnet-…"
                className="rounded-md mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Temperature（{temperature.toFixed(1)}）</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="mt-3 w-full"
              />
            </div>
            <div>
              <Label className="text-xs">Max tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="rounded-md mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">默认技能（自动应用，可被单封邮件覆盖）</Label>
            <select
              value={defaultSkillId}
              onChange={(e) => setDefaultSkillId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">不绑定</option>
              {availableSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.tone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">触发分类（逗号分隔）</Label>
            <Input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="例如：投诉, 反馈, support"
              className="rounded-md mt-1"
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-md">
              取消
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="flex-1 rounded-md">
              {submitting ? '保存中…' : isEdit ? '保存修改' : '创建角色'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
