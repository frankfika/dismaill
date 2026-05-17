#!/usr/bin/env node
/**
 * Screenshot capture script for Aura README
 * Captures real screenshots from the running application
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const assetsDir = join(rootDir, 'docs', 'assets');

const VIEWPORT = { width: 1280, height: 800 };

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name, options = {}) {
  const path = join(assetsDir, `${name}.png`);
  const { width = VIEWPORT.width, height = VIEWPORT.height, wait = 1000 } = options;

  await page.setViewportSize({ width, height });
  await sleep(wait);
  await page.screenshot({ path, type: 'png', fullPage: false });

  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

async function captureScreenshots() {
  // Create assets directory
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const BASE_URL = 'http://localhost:1420';

  try {
    console.log('\n📷 Capturing login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await captureScreenshot(page, 'login', { wait: 2000 });

    console.log('\n📷 Capturing inbox page...');
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'networkidle', timeout: 30000 });
    await captureScreenshot(page, 'inbox', { wait: 2000 });

    console.log('\n📷 Capturing compose page...');
    await page.goto(`${BASE_URL}/compose`, { waitUntil: 'networkidle', timeout: 30000 });
    await captureScreenshot(page, 'compose', { wait: 2000 });

    console.log('\n📷 Capturing settings page...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await captureScreenshot(page, 'settings', { wait: 2000 });

    console.log('\n📷 Capturing chat page...');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle', timeout: 30000 });
    await captureScreenshot(page, 'chat', { wait: 2000 });

    console.log('\n✨ All screenshots generated!');
    console.log(`📁 Location: ${assetsDir}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Make sure the dev server is running: pnpm dev');
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);