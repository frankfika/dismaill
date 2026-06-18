import { useState } from 'react'
import {
  Wand2,
  ChevronDown,
  Check,
  Briefcase,
  MessageCircle,
  Phone,
  Megaphone,
  Shield,
  Heart,
  Sparkles,
  Book,
  Beaker,
} from 'lucide-react'
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

export function AgentPicker({
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
