import { expect, test } from '@playwright/test';

test('creates a repair intake and records diagnosis', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reset preview' }).click();

  await page.getByTestId('new-intake').click();
  await page.getByTestId('intake-customer').fill('E2E Customer');
  await page.getByTestId('intake-manufacturer').fill('Orion');
  await page.getByTestId('intake-model').fill('Notebook 16');
  await page.getByTestId('intake-serial').fill('E2E-SERIAL-0001');
  await page.getByTestId('intake-fault').fill('The device shuts down during sustained load.');
  await page
    .getByTestId('intake-condition')
    .fill('No visible impact damage. Power adapter supplied.');
  await page.getByTestId('create-intake').click();

  await expect(page.getByTestId('case-workspace')).toContainText('Notebook 16');
  await expect(page.getByTestId('case-workspace')).toContainText('E2E Customer');

  await page.getByRole('tab', { name: 'Diagnosis' }).click();
  await page.getByTestId('diagnosis-summary').fill('Thermal shutdown reproduced after ten minutes.');
  await page
    .getByTestId('diagnosis-recommendation')
    .fill('Clean the cooling assembly and replace thermal compound.');
  await page.getByTestId('save-diagnosis').click();

  await expect(page.getByRole('status')).toContainText('Diagnosis saved');
  await expect(page.getByTestId('case-workspace')).toContainText('Version 2');
});
