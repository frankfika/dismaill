import { Sparkles, Wand2, X, Info, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import {
  Wand2 as WandIcon,
  Briefcase,
  MessageCircle,
  Phone,
  Megaphone,
  Shield,
  Heart,
  Sparkles as SparklesIcon,
  Book,
  Beaker,
} from 'lucide-react'
import type { AgentIcon, ReplyAgent, ReplySkill } from '@shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AGENT_ICONS: Record<AgentIcon, React.ComponentType<any>> = {
  wand: WandIcon,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  phone: Phone,
  megaphone: Megaphone,
  shield: Shield,
  heart: Heart,
  sparkles: SparklesIcon,
  book: Book,
  flask: Beaker,
}

export interface ComposeAIPanelProps {
  open: boolean
  onClose: () => void
  agents: ReplyAgent[]
  skills: ReplySkill[]
  selectedAgent?: ReplyAgent
  selectedSkill?: ReplySkill
  prompt: string
  onPromptChange: (v: string) => void
  isGenerating: boolean
  onGenerate: () => void
  error: string | null
}

export function ComposeAIPanel({
  open,
  onClose,
  agents,
  skills,
  selectedAgent,
  selectedSkill,
  prompt,
  onPromptChange,
  isGenerating,
  onGenerate,
  error,
}: ComposeAIPanelProps) {
  if (!open) return null

  return (
    <aside
      className="w-[320px] border-l border-border bg-card flex flex-col shrink-0"
      role="complementary"
      aria-label="AI Copilot"
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">AI Copilot</span>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭 AI 助手"
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
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="例如：告诉他会按时提交报告，并表达对延期的小歉意..."
            className="w-full h-32 p-3 text-xs bg-muted/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-muted/20">
        <Button
          type="button"
          className="w-full rounded-md gap-1.5"
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
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
    </aside>
  )
}
