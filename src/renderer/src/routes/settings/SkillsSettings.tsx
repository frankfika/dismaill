import { useEffect, useState } from 'react'
import { useSkills } from '../../hooks/useSkills'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  SKILL_TONE_PRESETS,
  SKILL_LANGUAGE_PRESETS,
  type ReplySkill,
  type ReplySkillExample,
  type SkillTone,
  type SkillLanguage,
  type CreateReplySkillInput,
  type UpdateReplySkillInput,
} from '@shared/types/skill.types'
import { Wand2, Sparkles, Plus, Copy, Pencil, Trash2, X } from 'lucide-react'

const STARTER_SKILLS: CreateReplySkillInput[] = [
  {
    name: '礼貌拒绝',
    description: '收到不合适的请求时，礼貌且坚定地婉拒',
    triggerCategories: ['拒绝', '婉拒', 'decline'],
    tone: 'firm',
    language: 'auto',
    maxLength: 300,
    includeSignature: true,
    systemPrompt:
      '你是一个善于表达拒绝的人。需要在不伤害对方感情的前提下，礼貌但坚定地婉拒对方的请求。给出 1-2 句具体原因（可以是泛化的，不必真实），并表达对对方的尊重。',
    examples: [
      {
        incoming: '能否免费帮我们做一份品牌方案？',
        outgoing:
          '感谢您的信任与邀请。本季度我们的设计排期已满，暂时无法承接新的免费项目；建议您关注我们下季度初发布的合作渠道。祝项目顺利。',
      },
    ],
    replyTemplate: '感谢 + 明确拒绝 + 简短原因 + 祝福/替代建议',
  },
  {
    name: '催款提醒',
    description: '温和地催收逾期款项，保持良好客户关系',
    triggerCategories: ['催款', '账单', 'payment', 'invoice'],
    tone: 'formal',
    language: 'auto',
    maxLength: 250,
    includeSignature: true,
    systemPrompt:
      '你是一个专业的财务联络人。需要礼貌地提醒对方有一笔款项已逾期。语气要克制、专业，并提供清晰的付款方式与截止日期。不要指责或带情绪。',
    examples: [
      {
        incoming: '我们注意到 4 月的款项还未到账',
        outgoing:
          '您好，截至今日我们尚未收到贵司 4 月份的应付款项（金额 X 元）。烦请在 5 个工作日内安排付款，并回复本邮件确认。如已完成转账，请忽略此邮件并提供凭证。谢谢配合。',
      },
    ],
    replyTemplate: '问候 + 陈述事实 + 截止时间 + 后续行动',
  },
  {
    name: '客户投诉回应',
    description: '面对客户投诉，先共情再解决',
    triggerCategories: ['投诉', '抱怨', 'complaint'],
    tone: 'apologetic',
    language: 'auto',
    maxLength: 350,
    includeSignature: true,
    systemPrompt:
      '你是一个重视客户体验的服务负责人。面对投诉，要先表达真诚歉意与共情，然后说明已采取的补救措施和后续跟进方案。不要找借口。',
    examples: [
      {
        incoming: '你们的服务太糟糕了，等了 3 天没人处理！',
        outgoing:
          '非常抱歉给您带来这样的体验，3 天的等待完全不可接受。我已亲自介入，指定 X 同事在 24 小时内给您一份完整的处理方案。我们也会复盘此次流程，避免再次发生。',
      },
    ],
    replyTemplate: '致歉 + 共情 + 已采取的措施 + 后续保障',
  },
  {
    name: '会议邀请',
    description: '清晰、专业的会议邀请邮件',
    triggerCategories: ['会议', 'meeting', '约时间'],
    tone: 'formal',
    language: 'auto',
    maxLength: 200,
    includeSignature: false,
    systemPrompt:
      '写一封专业、简洁的会议邀请邮件。包括会议目的、时间、地点/链接、需要对方准备的内容、备选时间。',
    examples: [
      {
        incoming: '想约你聊聊 Q3 规划',
        outgoing:
          '想跟您约 30 分钟同步一下 Q3 的关键规划。建议时间：周三 14:00-15:00 或 周四 10:00-11:00。议程我会提前一天发出。麻烦确认哪个时间方便。',
      },
    ],
    replyTemplate: '目的 + 时间 + 议程 + 确认请求',
  },
]

export function SkillsSettings() {
  const { skills, isLoading, createSkill, deleteSkill } = useSkills()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState<ReplySkill | null>(null)
  const [duplicating, setDuplicating] = useState<ReplySkill | null>(null)

  const handleAddStarter = async (preset: CreateReplySkillInput) => {
    const created = await createSkill(preset)
    if (created) setShowAddModal(false)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Wand2 size={18} className="text-primary" />
            回复技能
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            针对不同来信类型训练专属回复风格，撰写时一键套用
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setShowAddModal(true)
          }}
          className="rounded-md gap-1.5"
        >
          <Plus size={14} />
          新建技能
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">加载中…</div>
      ) : skills.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card py-10 text-center text-muted-foreground">
            <Wand2 size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm">还没有任何技能</p>
            <p className="mt-1 text-xs text-muted-foreground/80">从下面的预设开始，或新建你自己的</p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
              推荐起点
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STARTER_SKILLS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleAddStarter(preset)}
                  className="text-left rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{preset.name}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {skill.name}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {skill.tone}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {skill.description}
                    </p>
                  )}
                </div>
              </div>

              {skill.triggerCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {skill.triggerCategories.map((c) => (
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
                  {skill.examples.length} 个示例 · 已用 {skill.useCount} 次
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setDuplicating(skill)
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
                      setEditing(skill)
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
                      if (confirm(`确定删除「${skill.name}」？`)) deleteSkill(skill.id)
                    }}
                    className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <SkillEditorModal
          initial={
            editing
              ? ({
                  id: editing.id,
                  name: editing.name,
                  description: editing.description,
                  triggerCategories: editing.triggerCategories,
                  tone: editing.tone,
                  language: editing.language,
                  maxLength: editing.maxLength,
                  includeSignature: editing.includeSignature,
                  systemPrompt: editing.systemPrompt,
                  examples: editing.examples,
                  replyTemplate: editing.replyTemplate,
                } as UpdateReplySkillInput)
              : duplicating
              ? ({
                  name: duplicating.name + ' (副本)',
                  description: duplicating.description,
                  triggerCategories: duplicating.triggerCategories,
                  tone: duplicating.tone,
                  language: duplicating.language,
                  maxLength: duplicating.maxLength,
                  includeSignature: duplicating.includeSignature,
                  systemPrompt: duplicating.systemPrompt,
                  examples: duplicating.examples,
                  replyTemplate: duplicating.replyTemplate,
                } as UpdateReplySkillInput)
              : undefined
          }
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

export function SkillEditorModal({
  initial,
  onClose,
}: {
  initial?: UpdateReplySkillInput
  onClose: () => void
}) {
  const { updateSkill, createSkill } = useSkills()
  const isEdit = !!initial?.id
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tone, setTone] = useState<SkillTone>((initial?.tone as SkillTone) ?? 'formal')
  const [language, setLanguage] = useState<SkillLanguage>(initial?.language ?? 'auto')
  const [maxLength, setMaxLength] = useState(initial?.maxLength ?? 500)
  const [includeSignature, setIncludeSignature] = useState(initial?.includeSignature ?? false)
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const [replyTemplate, setReplyTemplate] = useState(initial?.replyTemplate ?? '')
  const [categories, setCategories] = useState((initial?.triggerCategories ?? []).join(', '))
  const [examples, setExamples] = useState<ReplySkillExample[]>(initial?.examples ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setTone((initial?.tone as SkillTone) ?? 'formal')
    setLanguage(initial?.language ?? 'auto')
    setMaxLength(initial?.maxLength ?? 500)
    setIncludeSignature(initial?.includeSignature ?? false)
    setSystemPrompt(initial?.systemPrompt ?? '')
    setReplyTemplate(initial?.replyTemplate ?? '')
    setCategories((initial?.triggerCategories ?? []).join(', '))
    setExamples(initial?.examples ?? [])
    setError(null)
  }, [initial])

  const addExample = () => setExamples((e) => [...e, { incoming: '', outgoing: '' }])
  const removeExample = (i: number) => setExamples((e) => e.filter((_, idx) => idx !== i))
  const updateExample = (i: number, field: 'incoming' | 'outgoing', value: string) => {
    setExamples((e) => e.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('请填写技能名称')
      return
    }
    const cats = categories.split(',').map((s) => s.trim()).filter(Boolean)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      triggerCategories: cats,
      tone,
      language,
      maxLength,
      includeSignature,
      systemPrompt: systemPrompt.trim(),
      examples: examples.filter((e) => e.incoming.trim() || e.outgoing.trim()),
      replyTemplate: replyTemplate.trim(),
    }
    setSubmitting(true)
    setError(null)
    if (isEdit && initial?.id) {
      const result = await updateSkill({ id: initial.id, ...payload })
      setSubmitting(false)
      if (result) onClose()
      else setError('更新失败')
    } else {
      const result = await createSkill(payload)
      setSubmitting(false)
      if (result) onClose()
      else setError('创建失败')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-base font-semibold text-foreground">
            {isEdit ? '编辑技能' : '新建技能'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs">技能名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：礼貌拒绝、催款提醒…"
              className="rounded-md mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">描述（什么场景用？）</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="一句话说清这个技能的用途"
              className="rounded-md mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">触发分类（逗号分隔）</Label>
            <Input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="例如：拒绝, 婉拒, decline"
              className="rounded-md mt-1"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              撰写页会按这些关键词自动推荐该技能
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">语气</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as SkillTone)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {SKILL_TONE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.desc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">语言</Label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SkillLanguage)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {SKILL_LANGUAGE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">最大长度（字符）</Label>
              <Input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                className="rounded-md mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">系统提示（给 AI 的核心指令）</Label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="描述这个技能希望 AI 扮演什么角色、怎么思考、遵守什么规则…"
              rows={4}
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs">Few-shot 样例（教会 AI 怎么写）</Label>
              <button
                type="button"
                onClick={addExample}
                className="text-xs text-primary hover:underline"
              >
                + 添加样例
              </button>
            </div>
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">样例 #{i + 1}</span>
                    <button
                      onClick={() => removeExample(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <Input
                    placeholder="来信（Incoming）"
                    value={ex.incoming}
                    onChange={(e) => updateExample(i, 'incoming', e.target.value)}
                    className="rounded-md text-sm"
                  />
                  <textarea
                    placeholder="回复（Outgoing）"
                    value={ex.outgoing}
                    onChange={(e) => updateExample(i, 'outgoing', e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              {examples.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-3">
                  还没有样例。添加 1-3 条会大幅提升回复质量。
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs">回复模板 / 结构（可选）</Label>
            <textarea
              value={replyTemplate}
              onChange={(e) => setReplyTemplate(e.target.value)}
              placeholder="例如：'感谢 + 陈述事实 + 截止时间 + 后续行动'"
              rows={2}
              className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeSig"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="includeSig" className="text-xs mb-0">
              自动追加邮箱签名
            </Label>
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
              {submitting ? '保存中…' : isEdit ? '保存修改' : '创建技能'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
