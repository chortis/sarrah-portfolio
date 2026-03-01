import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate from home to About', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page).toHaveTitle('Sarrah Campbell — About');
  });

  test('can navigate from home to CV', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'CV' }).first().click();
    await expect(page).toHaveURL(/\/resume$/);
    await expect(page).toHaveTitle('Sarrah Campbell — Resume');
  });

  test('can navigate from home to Client Work', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Client Work' }).first().click();
    await expect(page).toHaveURL(/\/private$/);
    await expect(page).toHaveTitle('Sarrah Campbell — Private Work');
  });

  test('logo links back to home', async ({ page }) => {
    await page.goto('./about');
    await page.locator('.logo').click();
    await expect(page).toHaveURL(/\/sarrah-portfolio\/$/);
  });

  test('nav links have correct hrefs', async ({ page }) => {
    await page.goto('./');
    const nav = page.locator('#main-nav');
    await expect(nav.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/sarrah-portfolio/');
    await expect(nav.getByRole('link', { name: 'Client Work' })).toHaveAttribute('href', '/sarrah-portfolio/private');
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/sarrah-portfolio/about');
    await expect(nav.getByRole('link', { name: 'CV' })).toHaveAttribute('href', '/sarrah-portfolio/resume');
  });
});

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu opens and closes', async ({ page }) => {
    await page.goto('./');
    const menuToggle = page.locator('#menu-toggle');
    await expect(menuToggle).toBeVisible();

    await menuToggle.click();
    await expect(page.locator('body')).toHaveClass(/nav-open/);

    const closeBtn = page.locator('#nav-close');
    await closeBtn.click();
    await expect(page.locator('body')).not.toHaveClass(/nav-open/);
  });

  test('can navigate via mobile menu', async ({ page }) => {
    await page.goto('./');
    await page.locator('#menu-toggle').click();
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
  });
});
