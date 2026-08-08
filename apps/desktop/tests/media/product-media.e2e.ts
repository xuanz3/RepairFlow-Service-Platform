import { _electron as electron, expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve(process.env.REPAIRFLOW_MEDIA_OUTPUT ?? '../../artifacts/media/desktop');

test('captures deterministic desktop product states from Electron', async () => {
  await mkdir(out, { recursive: true });
  const app = await electron.launch({
    args: process.platform === 'linux' && process.env.CI ? ['--no-sandbox', '.'] : ['.'],
    cwd: resolve('.'),
    env: { ...process.env, REPAIRFLOW_CAPTURE_MODE: '1' },
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.setViewportSize({ width: 1480, height: 940 });
  await expect(page.getByTestId('new-intake')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Repair operations' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset preview' }).click();
  await expect(page.getByTestId('case-workspace')).toContainText('Sample Customer', {
    timeout: 15000,
  });
  await page.screenshot({
    path: resolve(out, '02-desktop-workshop-dashboard.png'),
    fullPage: true,
  });
  await page.getByPlaceholder('Search reference, customer or device').fill('Northstar');
  await page.screenshot({ path: resolve(out, '03-desktop-case-explorer.png'), fullPage: true });
  await page.getByPlaceholder('Search reference, customer or device').fill('');
  await page.locator('.case-row').filter({ hasText: 'Orion Devices' }).first().click();
  await expect(page.getByTestId('case-workspace')).toContainText('Orion Devices', {
    timeout: 15000,
  });
  await page.getByRole('tab', { name: 'Overview' }).click();
  await page.screenshot({ path: resolve(out, '04-desktop-case-inspector.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Evidence' }).click();
  await page.screenshot({
    path: resolve(out, '05-desktop-evidence-comparison.png'),
    fullPage: true,
  });
  await page.getByRole('tab', { name: 'Quality review' }).click();
  await page.screenshot({ path: resolve(out, '06-desktop-quality-review.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Sync & conflicts' }).click();
  await expect(page.getByTestId('sync-conflict-centre')).toBeVisible();
  await page.screenshot({ path: resolve(out, '07-desktop-conflict-centre.png'), fullPage: true });
  await app.close();
});
