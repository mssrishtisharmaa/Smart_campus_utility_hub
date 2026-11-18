import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch();
const context = await browser.newContext({
  baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
  viewport: { width: 1440, height: 1000 },
  timezoneId: 'Asia/Kolkata',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
await mkdir('docs', { recursive: true });
try {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The sky has a story');
  await page.screenshot({ path: 'docs/premium-landing-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({ path: 'docs/premium-landing-dark.png', fullPage: true });
  await page.goto('/login');
  await page.getByRole('button', { name: /Farmer Demo/ }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
  await page.goto('/map');
  await expect(page.locator('.map-temperature')).toContainText(/\d/, { timeout: 30000 });
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await page.screenshot({ path: 'docs/premium-map-dark.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/premium-map-mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw new Error('Map overflows the mobile viewport.');
  }
  console.log('Captured light/dark landing and loaded desktop/mobile map.');
} finally {
  await browser.close();
}
