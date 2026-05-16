import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Connection Manager Unit Tests
 * Tests reconnection logic and connection health monitoring
 */

// Simulated Connection Manager
class ConnectionManager {
  private connections: Map<string, { healthy: boolean; lastCheck: number }> = new Map()
  private maxBackoffDelay = 30000
  private baseDelay = 1000

  registerConnection(accountId: string) {
    this.connections.set(accountId, { healthy: true, lastCheck: Date.now() })
  }

  unregisterConnection(accountId: string) {
    this.connections.delete(accountId)
  }

  calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = this.baseDelay * Math.pow(2, attempt)
    return Math.min(delay, this.maxBackoffDelay)
  }

  async reconnectWithBackoff(
    accountId: string,
    attemptFn: () => Promise<boolean>,
    maxAttempts = 5
  ): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const delay = this.calculateBackoffDelay(attempt)

      if (attempt > 0) {
        await this.sleep(delay)
      }

      try {
        const success = await attemptFn()
        if (success) {
          this.connections.set(accountId, { healthy: true, lastCheck: Date.now() })
          return true
        }
      } catch {
        // Continue to next attempt
      }
    }

    this.connections.set(accountId, { healthy: false, lastCheck: Date.now() })
    return false
  }

  async checkHealth(accountId: string): Promise<boolean> {
    const connection = this.connections.get(accountId)
    if (!connection) return false
    return connection.healthy
  }

  setHealth(accountId: string, healthy: boolean) {
    const connection = this.connections.get(accountId)
    if (connection) {
      connection.healthy = healthy
      connection.lastCheck = Date.now()
    }
  }

  getAllConnections() {
    return Array.from(this.connections.entries()).map(([id, state]) => ({
      accountId: id,
      healthy: state.healthy,
      lastCheck: state.lastCheck,
    }))
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager

  beforeEach(() => {
    connectionManager = new ConnectionManager()
  })

  describe('calculateBackoffDelay', () => {
    it('should return base delay for first attempt', () => {
      const delay = connectionManager.calculateBackoffDelay(0)
      expect(delay).toBe(1000)
    })

    it('should double delay for each subsequent attempt', () => {
      expect(connectionManager.calculateBackoffDelay(0)).toBe(1000) // 1s
      expect(connectionManager.calculateBackoffDelay(1)).toBe(2000) // 2s
      expect(connectionManager.calculateBackoffDelay(2)).toBe(4000) // 4s
      expect(connectionManager.calculateBackoffDelay(3)).toBe(8000) // 8s
      expect(connectionManager.calculateBackoffDelay(4)).toBe(16000) // 16s
    })

    it('should cap at maximum delay of 30 seconds', () => {
      expect(connectionManager.calculateBackoffDelay(5)).toBe(30000)
      expect(connectionManager.calculateBackoffDelay(6)).toBe(30000)
      expect(connectionManager.calculateBackoffDelay(10)).toBe(30000)
    })

    it('should follow exponential pattern 1s -> 2s -> 4s -> 8s', () => {
      const delays = [0, 1, 2, 3].map((i) => connectionManager.calculateBackoffDelay(i))

      expect(delays[0]).toBe(1000)
      expect(delays[1]).toBe(2000)
      expect(delays[2]).toBe(4000)
      expect(delays[3]).toBe(8000)
    })
  })

  describe('registerConnection', () => {
    it('should register a new connection', () => {
      connectionManager.registerConnection('acc-001')

      const connections = connectionManager.getAllConnections()
      expect(connections).toHaveLength(1)
      expect(connections[0].accountId).toBe('acc-001')
      expect(connections[0].healthy).toBe(true)
    })

    it('should track multiple connections', () => {
      connectionManager.registerConnection('acc-001')
      connectionManager.registerConnection('acc-002')
      connectionManager.registerConnection('acc-003')

      const connections = connectionManager.getAllConnections()
      expect(connections).toHaveLength(3)
    })
  })

  describe('unregisterConnection', () => {
    it('should remove a connection', () => {
      connectionManager.registerConnection('acc-001')
      connectionManager.unregisterConnection('acc-001')

      const connections = connectionManager.getAllConnections()
      expect(connections).toHaveLength(0)
    })
  })

  describe('checkHealth', () => {
    it('should return true for healthy connection', async () => {
      connectionManager.registerConnection('acc-001')

      const isHealthy = await connectionManager.checkHealth('acc-001')

      expect(isHealthy).toBe(true)
    })

    it('should return false for unregistered connection', async () => {
      const isHealthy = await connectionManager.checkHealth('unknown')

      expect(isHealthy).toBe(false)
    })

    it('should return false for unhealthy connection', async () => {
      connectionManager.registerConnection('acc-001')
      connectionManager.setHealth('acc-001', false)

      const isHealthy = await connectionManager.checkHealth('acc-001')

      expect(isHealthy).toBe(false)
    })
  })

  describe('setHealth', () => {
    it('should update connection health status', async () => {
      connectionManager.registerConnection('acc-001')
      connectionManager.setHealth('acc-001', false)

      expect(await connectionManager.checkHealth('acc-001')).toBe(false)

      connectionManager.setHealth('acc-001', true)

      expect(await connectionManager.checkHealth('acc-001')).toBe(true)
    })
  })

  describe('reconnectWithBackoff', () => {
    it('should succeed on first attempt if connection succeeds', async () => {
      connectionManager.registerConnection('acc-001')
      const attemptFn = vi.fn().mockResolvedValue(true)

      const result = await connectionManager.reconnectWithBackoff('acc-001', attemptFn)

      expect(result).toBe(true)
      expect(attemptFn).toHaveBeenCalledTimes(1)
    })

    it('should retry with backoff on failure', async () => {
      connectionManager.registerConnection('acc-001')
      const attemptFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue(true)

      const result = await connectionManager.reconnectWithBackoff('acc-001', attemptFn, 3)

      expect(result).toBe(true)
      expect(attemptFn).toHaveBeenCalledTimes(3)
    })

    it('should give up after max attempts', async () => {
      connectionManager.registerConnection('acc-001')
      const attemptFn = vi.fn().mockRejectedValue(new Error('Always fails'))

      const result = await connectionManager.reconnectWithBackoff('acc-001', attemptFn, 3)

      expect(result).toBe(false)
      expect(attemptFn).toHaveBeenCalledTimes(3)
      expect(await connectionManager.checkHealth('acc-001')).toBe(false)
    })

    it('should handle false return from attempt function', async () => {
      connectionManager.registerConnection('acc-001')
      const attemptFn = vi.fn().mockResolvedValue(false)

      const result = await connectionManager.reconnectWithBackoff('acc-001', attemptFn, 2)

      expect(result).toBe(false)
    })
  })

  describe('getAllConnections', () => {
    it('should return empty array when no connections', () => {
      const connections = connectionManager.getAllConnections()

      expect(connections).toEqual([])
    })

    it('should return all registered connections', () => {
      connectionManager.registerConnection('acc-001')
      connectionManager.registerConnection('acc-002')

      const connections = connectionManager.getAllConnections()

      expect(connections).toHaveLength(2)
      expect(connections.map((c) => c.accountId)).toContain('acc-001')
      expect(connections.map((c) => c.accountId)).toContain('acc-002')
    })
  })
})
