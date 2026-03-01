import { test, expect } from '@playwright/test';

const PASSWORD = process.env.TEST_PASSWORD!;

test.describe('Private / Client Work page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./private');
  });

  test('shows password gate by default', async ({ page }) => {
    await expect(page.locator('#password-gate')).toBeVisible();
    await expect(page.locator('#protected-content')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Client Work' })).toBeVisible();
    await expect(page.getByText('Enter the password to view this content.')).toBeVisible();
  });

  test('has password input and submit button', async ({ page }) => {
    await expect(page.locator('#password-input')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible();
  });

  test('has back to portfolio link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Back to portfolio/i });
    await expect(backLink).toBeVisible();
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.locator('#password-input').fill('wrongpassword');
    await page.getByRole('button', { name: 'Enter' }).click();

    const error = page.locator('#password-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Incorrect password. Please try again.');
    await expect(page.locator('#password-input')).toHaveValue('');
  });

  test('clears input and refocuses after wrong password', async ({ page }) => {
    await page.locator('#password-input').fill('wrongpassword');
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.locator('#password-input')).toHaveValue('');
    await expect(page.locator('#password-input')).toBeFocused();
  });

  test('unlocks content with correct password', async ({ page }) => {
    await page.locator('#password-input').fill(PASSWORD);
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.locator('#password-gate')).toBeHidden();
    await expect(page.locator('#protected-content')).toBeVisible();
  });

  test('shows header and footer after unlocking', async ({ page }) => {
    await page.locator('#password-input').fill(PASSWORD);
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.locator('#site-header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('shows videos and images after unlocking', async ({ page }) => {
    await page.locator('#password-input').fill(PASSWORD);
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.locator('#protected-content')).toBeVisible();
    const videos = page.locator('#protected-content video');
    expect(await videos.count()).toBeGreaterThan(0);
    const images = page.locator('#protected-content .gallery-grid img');
    expect(await images.count()).toBeGreaterThan(0);
  });

  test('remembers authentication in session', async ({ page }) => {
    await page.locator('#password-input').fill(PASSWORD);
    await page.getByRole('button', { name: 'Enter' }).click();
    await expect(page.locator('#protected-content')).toBeVisible();

    await page.reload();
    await expect(page.locator('#password-gate')).toBeHidden();
    await expect(page.locator('#protected-content')).toBeVisible();
  });
});
