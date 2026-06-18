/**
 * Smoke tests for the Inbox route.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }))

import Inbox from '../../../src/renderer/src/routes/Inbox'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Inbox', () => {
  it('renders the page heading and empty state when there are no emails', async () => {
    render(
      <MemoryRouter>
        <Inbox />
      </MemoryRouter>,
    )
    expect(screen.getByText('收件箱')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/暂无邮件/)).toBeInTheDocument()
    })
  })

  it('shows a refresh button', () => {
    render(
      <MemoryRouter>
        <Inbox />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /刷新/ })).toBeInTheDocument()
  })
})
