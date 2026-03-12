import { expect, test } from '@playwright/test';

test.describe('Dashboard smoke', () => {
  test('@smoke public pages render', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/entrar|login/i)).toBeVisible();

    await page.goto('/privacy');
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('@smoke new operations routes are protected by auth', async ({ page }) => {
    await page.goto('/dashboard/pricing');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/emergency');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/operations');
    await expect(page).toHaveURL(/\/login/);
  });
});
