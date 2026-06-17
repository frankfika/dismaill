/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Bypass the @milkdown/react binding to dodge a peer-version mismatch
// between @milkdown/core@7.21 and @milkdown/react@7.18. We mount the
// editor imperatively and listen for markdown updates via the listener
// plugin. If Milkdown fails to initialise (e.g. older browser) we fall
// back to a plain <textarea> so the compose form still works.
import { useEffect, useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, parserCtx } from '@milkdown/core'
import { nord } from '@milkdown/theme-nord'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { cn } from '../../lib/utils'
import './editor.css'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

export function MilkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  className,
}: MilkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  // Track whether the editor is mounted so we can fall back to a
  // textarea if Milkdown fails (older WebKit, missing plugin, etc.).
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!hostRef.current) return
    let cancelled = false
    const host = hostRef.current

    const make = async () => {
      try {
        const editor = Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, host)
            ctx.set(defaultValueCtx, value)
            ctx.get(listenerCtx).markdownUpdated((_ctx: unknown, markdown: string) => {
              onChangeRef.current(markdown)
            })
          })
          .config(nord as any)
          .use(commonmark as any)
          .use(gfm as any)
          .use(history as any)
          .use(clipboard as any)
          .use(cursor as any)
          .use(listener as any)
          .create()

        const inst = await editor
        if (cancelled) {
          inst.destroy().catch(() => {})
          return
        }
        editorRef.current = inst
        mountedRef.current = true
      } catch (err) {
        console.warn('[MilkdownEditor] failed to mount, falling back to textarea:', err)
        mountedRef.current = false
      }
    }
    make()

    return () => {
      cancelled = true
      const inst = editorRef.current
      if (inst) {
        try { inst.destroy() } catch { /* editor may already be unmounted */ }
        editorRef.current = null
      }
    }
    // value is set via defaultValueCtx at mount; further updates flow
    // through the user (we don't push them back to avoid cursor jumps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply external value changes (e.g., AI generation) without destroying
  // the editor. Skip while the editor has focus to avoid overwriting the
  // user's current selection as they type.
  useEffect(() => {
    const inst = editorRef.current
    const host = hostRef.current
    if (!inst || !host) return
    if (host.contains(document.activeElement)) return
    try {
      inst.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const parser = ctx.get(parserCtx)
        const doc = parser(value)
        const { state } = view
        const tr = state.tr.replaceWith(0, state.doc.content.size, doc)
        view.dispatch(tr)
      })
    } catch (err) {
      console.warn('[MilkdownEditor] failed to update content, falling back to textarea:', err)
      mountedRef.current = false
    }
  }, [value])

  return (
    <div
      className={cn(
        'milkdown-editor-wrapper relative rounded-md border border-input bg-background',
        readOnly && 'pointer-events-none opacity-70',
        className
      )}
    >
      {value === '' && (
        <div className="absolute inset-0 pointer-events-none flex items-start p-4 z-10">
          <span className="text-muted-foreground">{placeholder}</span>
        </div>
      )}
      <div ref={hostRef} className="milkdown-host" />
      {/* Fallback textarea — only visible if Milkdown never mounted. */}
      <FallbackTextarea
        value={value}
        onChange={onChange}
        hidden={mountedRef.current}
        placeholder={placeholder}
      />
    </div>
  )
}

function FallbackTextarea({
  value,
  onChange,
  hidden,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  hidden: boolean
  placeholder: string
}) {
  if (hidden) return null
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[400px] bg-background p-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
    />
  )
}
