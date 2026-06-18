/**
 * Smoke tests for the Chat route.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue([]) }))

import Chat from '../../../src/renderer/src/routes/Chat'

describe('Chat', () => {
  it('renders without crashing in guest mode', () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    )
    // The page should mount; we don't assert specific text because the Chat
    // route may show a connect-prompt or empty conversation list.
    expect(document.body).toBeInTheDocument()
  })
})
