/**
 * Smoke tests for the Settings page tabs and the 5 sub-routes.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }))

import Settings from '../../../src/renderer/src/routes/Settings'

describe('Settings page', () => {
  it('renders the sidebar nav with all 5 tabs', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    )
    expect(screen.getByText('设置中心')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /邮箱账户/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /签名管理/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI 角色/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /回复技能/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI 设置/ })).toBeInTheDocument()
  })

  it('shows the accounts tab by default with empty state', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('邮箱账户').length).toBeGreaterThan(0)
    expect(screen.getByText(/暂无邮箱账户/)).toBeInTheDocument()
  })
})
