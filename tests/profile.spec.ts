import { test, expect } from '@playwright/test';
import { loginAsJuan } from './auth-helpers';

test.describe('User Profile Actions', () => {

  test('should allow Juan to view his own profile', async ({ page }) => {
    // Start the test already logged in
    await loginAsJuan(page);

    // Navigate to the profile
    await page.goto('/user/JuanCruz');

    // Assert the profile username is visible in the h6 subtitle
    await expect(page.locator('h6.card-subtitle')).toContainText('JuanCruz');
  });

  test('should allow Juan to change his password', async ({ page }) => {
    
  });
});