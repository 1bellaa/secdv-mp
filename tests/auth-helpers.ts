import { Page, expect } from '@playwright/test';

/**
 * Standard login helper for the generic user 'JuanCruz'
 */
export async function loginAsJuan(page: Page) {
  await page.goto('/login');
  
  // Requirement 2.3.1: Interact with the placeholder-based inputs
  await page.getByPlaceholder('Username').fill('JuanCruz');
  await page.getByPlaceholder('Password').fill('Abc123**');
  
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for the redirect to confirm login worked before continuing the test
  await expect(page).toHaveURL('/home');
}

/**
 * Helper to handle the Security Answer step if needed
 */
export async function verifySecurityAnswer(page: Page) {
  // Assuming the placeholder is "Security Answer"
  await page.getByPlaceholder('Security Answer').fill('Peanut');
  await page.getByRole('button', { name: 'Submit' }).click();
}