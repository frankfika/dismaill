import { cn } from '../../lib/utils'

interface EditorToolbarProps {
  onBold?: () => void
  onItalic?: () => void
  onStrikethrough?: () => void
  onHeading?: (level: 1 | 2 | 3 | 4) => void
  onBulletList?: () => void
  onOrderedList?: () => void
  onLink?: () => void
  onQuote?: () => void
  onCode?: () => void
  onCodeBlock?: () => void
  className?: string
}

interface ToolbarButtonProps {
  onClick?: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'p-2 rounded-md transition-colors text-sm font-medium',
      active
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
    )}
  >
    {children}
  </button>
)

export function EditorToolbar({
  onBold,
  onItalic,
  onStrikethrough,
  onHeading,
  onBulletList,
  onOrderedList,
  onLink,
  onQuote,
  onCode,
  onCodeBlock,
  className,
}: EditorToolbarProps) {
  return (
    <div
      className={cn(
        'editor-toolbar flex flex-wrap items-center gap-1 p-2 border-b border-input bg-muted/50 rounded-t-md',
        className
      )}
    >
      {/* Text formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <ToolbarButton onClick={onBold} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={onItalic} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={onStrikethrough} title="Strikethrough">
          <span className="line-through">S</span>
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton onClick={() => onHeading?.(1)} title="Heading 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => onHeading?.(2)} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => onHeading?.(3)} title="Heading 3">
          H3
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 px-2 border-r border-border">
        <ToolbarButton onClick={onBulletList} title="Bullet List">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onOrderedList} title="Numbered List">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h12M7 12h12M7 17h12M3 7h.01M3 12h.01M3 17h.01" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-1 pl-2">
        <ToolbarButton onClick={onLink} title="Insert Link">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onQuote} title="Quote">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onCode} title="Inline Code">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={onCodeBlock} title="Code Block">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>
      </div>
    </div>
  )
}
