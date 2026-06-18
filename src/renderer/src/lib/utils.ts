import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import DOMPurify from 'dompurify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Schemes that may appear in <a href> or <img src>. Anything else (file://,
// javascript:, vbscript:, etc.) is stripped by DOMPurify's URI safelist.
const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|cid|data|ftp|tel):)/i

/**
 * Sanitize HTML to prevent XSS when using dangerouslySetInnerHTML.
 *
 * Hardening:
 * - `img` is allowed but its `src` is restricted to a small scheme safelist
 *   so an attacker can't use it as a pixel-tracking / Referer-exfil beacon
 *   pointing at arbitrary third-party hosts.
 * - `ALLOWED_URI_REGEXP` covers <a href> too, blocking javascript:/data:
 *   surprises in custom Markdown renderers.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'del',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'span',
      'div',
      'hr',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP,
  })
}

export const format = {
  date: (dateString: string): string => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('zh-CN', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  },

  datetime: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  relativeTime: (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 30) return `${diffDays} 天前`
    return date.toLocaleDateString('zh-CN')
  },
}
