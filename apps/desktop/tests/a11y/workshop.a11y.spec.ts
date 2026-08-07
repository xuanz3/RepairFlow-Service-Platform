import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('workshop has no serious accessibility violations and remains keyboard usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Repair operations' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const blocking = results.violations.filter((item) => ['critical','serious'].includes(item.impact ?? ''));
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '125%'; });
  await expect(page.getByTestId('case-workspace')).toBeVisible();
});
