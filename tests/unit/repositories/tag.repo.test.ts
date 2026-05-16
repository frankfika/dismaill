import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * TagRepository Unit Tests
 * Tests tag CRUD operations using mocked database
 * Note: better-sqlite3 native module is compiled for Electron and cannot
 * be loaded in the test Node.js runtime, so we mock the database layer.
 */

// Mock better-sqlite3
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}))

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn(() => ({
      prepare: mockPrepare,
      exec: vi.fn(),
    })),
  }
})

import { TagRepository } from '../../../src/main/database/repositories/tag.repo'

describe('TagRepository', () => {
  let repo: TagRepository

  beforeEach(() => {
    vi.clearAllMocks()
    const db = { prepare: mockPrepare, exec: vi.fn() } as any
    repo = new TagRepository(db)
  })

  describe('create', () => {
    it('should create a new tag', () => {
      mockGet.mockReturnValue({
        id: 'tag-1',
        wallet_address: '0x123',
        name: 'Work',
        color: '#FF0000',
        description: 'Work related emails',
        is_ai_enabled: 0,
        sort_order: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      })

      const tag = repo.create({
        id: 'tag-1',
        walletAddress: '0x123',
        name: 'Work',
        color: '#FF0000',
        description: 'Work related emails',
        isAiEnabled: false,
      })

      expect(mockRun).toHaveBeenCalled()
      expect(tag.id).toBe('tag-1')
      expect(tag.name).toBe('Work')
      expect(tag.color).toBe('#FF0000')
    })
  })

  describe('findByName', () => {
    it('should find tag by name', () => {
      mockGet.mockReturnValue({
        id: 'tag-1',
        wallet_address: '0x123',
        name: 'Work',
        color: '#FF0000',
        description: null,
        is_ai_enabled: 0,
        sort_order: 0,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      })

      const found = repo.findByName('0x123', 'Work')
      expect(found).toBeDefined()
      expect(found?.name).toBe('Work')
    })

    it('should return null for non-existent tag', () => {
      mockGet.mockReturnValue(undefined)

      const found = repo.findByName('0x123', 'Personal')
      expect(found).toBeNull()
    })
  })

  describe('findByWallet', () => {
    it('should find tags by wallet', () => {
      mockAll.mockReturnValue([
        {
          id: 'tag-1',
          wallet_address: '0x123',
          name: 'Work',
          color: '#FF0000',
          description: null,
          is_ai_enabled: 0,
          sort_order: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          email_count: 5,
        },
        {
          id: 'tag-2',
          wallet_address: '0x123',
          name: 'Personal',
          color: '#00FF00',
          description: null,
          is_ai_enabled: 0,
          sort_order: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          email_count: 3,
        },
      ])

      const tags = repo.findByWallet('0x123')
      expect(tags).toHaveLength(2)
    })
  })

  describe('applyTag', () => {
    it('should apply tag to email', () => {
      // applyTag calls run() to insert
      mockRun.mockReturnValue({ changes: 1 })
      // getTagsForEmail calls all() to fetch
      mockAll.mockReturnValue([
        {
          id: 'tag-1',
          wallet_address: '0x123',
          name: 'Work',
          color: '#FF0000',
          description: null,
          is_ai_enabled: 0,
          sort_order: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ])

      repo.applyTag('email-1', 'tag-1')

      expect(mockRun).toHaveBeenCalled()

      const tags = repo.getTagsForEmail('email-1')
      expect(tags).toHaveLength(1)
      expect(tags[0].id).toBe('tag-1')
    })
  })
})
