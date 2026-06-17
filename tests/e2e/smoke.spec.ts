import { test, expect } from '@playwright/test'

// Minimal Tauri internals mock so the renderer can boot in a normal browser.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async () => ({}),
      transformCallback: () => 0,
    }
  })
})

test('Login page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('用钱包进入')).toBeVisible()
  await expect(page.getByText('NovaMail')).toBeVisible()
  await expect(page.getByText('快速体验（演示模式）')).toBeVisible()
})

test('Guest mode button exists', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('跳过登录，以游客模式体验')).toBeVisible()
})

test('Sidebar navigation works in guest mode', async ({ page }) => {
  await page.goto('/inbox')
  await expect(page.getByRole('link', { name: '收件箱' })).toBeVisible()
  await expect(page.getByRole('link', { name: '写邮件' })).toBeVisible()
  await expect(page.getByRole('link', { name: '聊天' })).toBeVisible()
  await expect(page.getByRole('link', { name: '标签' })).toBeVisible()
  await expect(page.getByRole('link', { name: '设置' })).toBeVisible()
})
