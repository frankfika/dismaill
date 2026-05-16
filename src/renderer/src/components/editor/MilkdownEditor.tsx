import { useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core'
import { nord } from '@milkdown/theme-nord'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { clipboard } from '@milkdown/plugin-clipboard'
import { cursor } from '@milkdown/plugin-cursor'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { Milkdown, useEditor } from '@milkdown/react'
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
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          onChangeRef.current(markdown)
        })
      })
      // @ts-expect-error milkdown theme-nord has a version mismatch with core ctx types
      .config(nord)
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(cursor)
      .use(listener)
  }, [])

  // Note: Milkdown editor content sync is handled internally
  // The editor instance is available via the useEditor hook if needed
  void editor

  return (
    <div
      className={cn(
        'milkdown-editor-wrapper relative rounded-md border border-input bg-background',
        readOnly && 'pointer-events-none opacity-70',
        className
      )}
    >
      {value === '' && (
        <div className="absolute inset-0 pointer-events-none flex items-start p-4">
          <span className="text-muted-foreground">{placeholder}</span>
        </div>
      )}
      <Milkdown />
    </div>
  )
}
