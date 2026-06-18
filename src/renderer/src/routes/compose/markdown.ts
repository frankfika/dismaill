import { sanitizeHtml } from '../../lib/utils'

/**
 * Tiny Markdown → HTML renderer for the Compose preview pane.
 *
 * **Not a general-purpose Markdown parser.** The output is run through
 * `sanitizeHtml` so any embedded `<script>` or `javascript:` URLs are
 * stripped before reaching the DOM. The renderer itself only knows a
 * handful of constructs (headings, lists, code, links, emphasis).
 */
export function renderMarkdown(markdown: string): string {
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
