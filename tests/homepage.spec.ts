import { test, expect } from '@playwright/test';

test.describe('Homepage / Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Sarrah Campbell — Storyboard Artist');
  });

  test('displays header with name and subtitle', async ({ page }) => {
    await expect(page.locator('.logo')).toHaveText('Sarrah Campbell');
    await expect(page.locator('.logo-sub')).toHaveText('Senior Storyboard Artist');
  });

  test('navigation links are present', async ({ page }) => {
    const nav = page.locator('#main-nav');
    await expect(nav.getByRole('link', { name: 'Portfolio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Client Work' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'CV' })).toBeVisible();
  });

  test('portfolio displays videos', async ({ page }) => {
    const videos = page.locator('.board-grid video');
    const count = await videos.count();
    expect(count).toBeGreaterThan(0);
  });

  test('gallery displays images', async ({ page }) => {
    const galleryImages = page.locator('.gallery-grid img');
    const count = await galleryImages.count();
    expect(count).toBeGreaterThan(0);
    await expect(galleryImages.first()).toBeVisible();
  });

  test('contact info in header is correct', async ({ page }) => {
    const headerSocials = page.locator('.nav-socials');
    await expect(headerSocials.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:sarrahecampbell@gmail.com');
  });

  test('footer displays copyright with correct name', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('Sarrah Campbell. All rights reserved.');
  });
});
