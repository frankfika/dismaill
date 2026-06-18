/**
 * Smoke tests for the Tags route.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }))

import Tags from '../../../src/renderer/src/routes/Tags'

describe('Tags', () => {
  it('renders the tags heading', () => {
    render(
      <MemoryRouter>
        <Tags />
      </MemoryRouter>,
    )
    expect(screen.getByText('智能标签')).toBeInTheDocument()
  })
})
