import { test, expect } from '@playwright/test';

test.describe('Dark mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('theme toggle button exists', async ({ page }) => {
    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Toggle dark/light mode');
  });

  test('clicking toggle changes theme attribute', async ({ page }) => {
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    await page.locator('#theme-toggle').click();
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('toggling twice returns to original theme', async ({ page }) => {
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    await page.locator('#theme-toggle').click();
    await page.locator('#theme-toggle').click();
    const finalTheme = await html.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });

  test('theme persists in localStorage', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBeTruthy();

    await page.locator('#theme-toggle').click();
    const theme2 = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme2).not.toBe(theme);
  });

  test('theme persists across page reload', async ({ page }) => {
    await page.locator('#theme-toggle').click();
    const themeAfterClick = await page.locator('html').getAttribute('data-theme');

    await page.reload();
    const themeAfterReload = await page.locator('html').getAttribute('data-theme');
    expect(themeAfterReload).toBe(themeAfterClick);
  });
});
