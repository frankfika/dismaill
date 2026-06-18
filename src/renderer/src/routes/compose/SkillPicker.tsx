import { useState } from 'react'
import { Wand2, ChevronDown, Check } from 'lucide-react'
import type { ReplySkill } from '@shared/types/skill.types'

export function SkillPicker({
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
