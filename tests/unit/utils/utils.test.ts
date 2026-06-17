/**
 * Unit Tests - Utils (cn, format)
 */
import { describe, it, expect } from 'vitest'
import { cn, format, sanitizeHtml } from '../../../src/renderer/src/lib/utils'

describe('Utils', () => {
  describe('cn (classnames merge)', () => {
    it('应该合并类名', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('应该处理条件类名', () => {
      expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
    })

    it('应该合并 Tailwind 冲突类', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6')
    })

    it('应该处理 undefined 和 null', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('应该处理空字符串', () => {
      expect(cn('', 'foo', '')).toBe('foo')
    })
  })

  describe('format.date', () => {
    it('今天的日期应该显示时间', () => {
      const now = new Date()
      const result = format.date(now.toISOString())
      // Should be a time format like "14:30"
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })

    it('昨天的日期应该显示"昨天"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(format.date(yesterday.toISOString())).toBe('昨天')
    })

    it('一周内应该显示星期', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const result = format.date(threeDaysAgo.toISOString())
      // Should be a weekday like "周一"
      expect(result).toBeTruthy()
      expect(result).not.toBe('昨天')
    })

    it('无效日期应该返回空字符串', () => {
      expect(format.date('')).toBe('')
      expect(format.date('invalid')).toBe('')
    })
  })

  describe('sanitizeHtml', () => {
    it('应该保留允许的格式标签', () => {
      expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toContain('<p>')
      expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toContain('<strong>')
    })

    it('应该移除 script 标签', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('应该移除事件处理器', () => {
      const result = sanitizeHtml('<p onclick="alert(1)">Hello</p>')
      expect(result).not.toContain('onclick')
    })

    it('应该允许安全的链接属性', () => {
      const result = sanitizeHtml('<a href="https://example.com" target="_blank">link</a>')
      expect(result).toContain('href="https://example.com"')
    })
  })

  describe('format.datetime', () => {
    it('应该返回完整日期时间', () => {
      const result = format.datetime('2024-06-15T14:30:00Z')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('format.relativeTime', () => {
    it('刚刚应该返回"刚刚"', () => {
      const now = new Date()
      expect(format.relativeTime(now.toISOString())).toBe('刚刚')
    })

    it('几分钟前应该返回分钟数', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(format.relativeTime(fiveMinAgo.toISOString())).toBe('5 分钟前')
    })

    it('几小时前应该返回小时数', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(format.relativeTime(threeHoursAgo.toISOString())).toBe('3 小时前')
    })

    it('几天前应该返回天数', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      expect(format.relativeTime(twoDaysAgo.toISOString())).toBe('2 天前')
    })

    it('超过30天应该返回日期', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      const result = format.relativeTime(twoMonthsAgo.toISOString())
      expect(result).not.toContain('天前')
    })
  })
})
