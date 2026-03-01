import { test, expect } from '@playwright/test';

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./about');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Sarrah Campbell — About');
  });

  test('displays name correctly', async ({ page }) => {
    await expect(page.locator('.logo')).toHaveText('Sarrah Campbell');
  });

  test('has get in touch email link', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Get in touch/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', 'mailto:sarrahecampbell@gmail.com');
  });

  test('has header and footer', async ({ page }) => {
    await expect(page.locator('#site-header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});
