/**
 * E2E Test Helper for Electron
 * Provides utilities for testing Electron applications with Playwright
 */

import { test as base, Page, ElectronApplication, _electron as electron } from '@playwright/test'
import path from 'path'

// Extend Playwright test with Electron-specific fixtures
export const test = base.extend<{
  electronApp: ElectronApplication
  page: Page
}>({
  electronApp: async ({}, use) => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../out/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    await use(electronApp)

    // Cleanup
    await electronApp.close()
  },

  page: async ({ electronApp }, use) => {
    // Get the first window
    const page = await electronApp.firstWindow()

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')

    await use(page)
  },
})

export { expect } from '@playwright/test'

/**
 * Mock wallet connection for E2E tests
 */
export async function mockWalletConnect(page: Page, wallet: { address: string; ensName?: string }) {
  await page.evaluate((w) => {
    window.__mockWallet = {
      address: w.address,
      ensName: w.ensName,
      signMessage: async (msg: string) => `signature-${msg}`,
      request: async () => ({ method: 'eth_requestAccounts', result: [w.address] }),
    }
  }, wallet)
}

/**
 * Mock OAuth flow for email account
 */
export async function mockOAuth(page: Page, email: string) {
  await page.evaluate((e) => {
    window.__mockOAuth = {
      email: e,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }
  }, email)
}

/**
 * Wait for app to be ready
 */
export async function waitForAppReady(page: Page, timeout = 10000) {
  await page.waitForSelector('[data-testid="app-ready"]', { timeout })
}

/**
 * Login with wallet (bypass actual wallet connection)
 */
export async function loginWithWallet(page: Page, wallet: { address: string; ensName?: string }) {
  await mockWalletConnect(page, wallet)

  // Click connect button
  await page.click('[data-testid="connect-wallet-btn"]')

  // Wait for login to complete
  await page.waitForSelector('[data-testid="inbox-page"], [data-testid="add-email-page"]', {
    timeout: 10000,
  })
}

/**
 * Seed test data
 */
export async function seedTestData(page: Page, data: { emails?: number; accounts?: number }) {
  await page.evaluate((d) => {
    window.__testData = d
  }, data)
}

/**
 * Get Electron app metrics
 */
export async function getAppMetrics(electronApp: ElectronApplication) {
  const metrics = await electronApp.evaluate(({ app }) => {
    const appMetrics = app.getAppMetrics()
    return {
      pid: process.pid,
      memory: appMetrics[0]?.memory?.workingSetSize || 0,
      cpu: appMetrics[0]?.cpu?.CPUUsage || 0,
    }
  })

  return metrics
}

/**
 * Simulate offline mode
 */
export async function goOffline(context: any) {
  await context.setOffline(true)
}

/**
 * Simulate online mode
 */
export async function goOnline(context: any) {
  await context.setOffline(false)
}

/**
 * Take screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(__dirname, '../screenshots', `${name}-${Date.now()}.png`),
    fullPage: true,
  })
}

// Type declarations for window mocks
declare global {
  interface Window {
    __mockWallet?: {
      address: string
      ensName?: string
      signMessage: (msg: string) => Promise<string>
      request: () => Promise<{ method: string; result: string[] }>
    }
    __mockOAuth?: {
      email: string
      accessToken: string
      refreshToken: string
    }
    __testData?: {
      emails?: number
      accounts?: number
    }
  }
}
