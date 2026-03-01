import { test, expect } from '@playwright/test';

test.describe('Resume page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./resume');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Sarrah Campbell — Resume');
  });

  test('displays name correctly', async ({ page }) => {
    await expect(page.locator('.logo')).toHaveText('Sarrah Campbell');
  });

  test('displays Experience section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
  });

  test('displays Education section with correct program and university', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Education' })).toBeVisible();
    await expect(page.getByText('2D Animation Program')).toBeVisible();
    await expect(page.getByText('Capilano University')).toBeVisible();
  });

  test('print header has email and website links', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    const resumeContact = page.locator('.resume-contact');
    await expect(resumeContact.getByRole('link', { name: 'sarrahecampbell@gmail.com' })).toHaveAttribute('href', 'mailto:sarrahecampbell@gmail.com');
    await expect(resumeContact.getByRole('link', { name: 'sarrahcampbell.com' })).toHaveAttribute('href', 'https://sarrahcampbell.com');
  });

  test('print header is hidden on screen', async ({ page }) => {
    await expect(page.locator('.resume-header.print-only')).toBeHidden();
  });

  test('print header is visible in print mode', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.resume-header.print-only')).toBeVisible();
  });

  test('has print button', async ({ page }) => {
    const printBtn = page.getByRole('button', { name: /Print|Save as PDF/i });
    await expect(printBtn).toBeVisible();
  });

  test('has header and footer', async ({ page }) => {
    await expect(page.locator('#site-header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});
