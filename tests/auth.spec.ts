import { test, expect } from '@playwright/test';

test('Successful login redirect', async ({ page }) => {
  // 1. Navigate to the login page
  // baseURL is http://localhost:5173, so we just add the path
  await page.goto('/login');

  // 2. Locate and fill the Username field
  await page.getByPlaceholder('Username').fill('admin');

  // 3. Locate and fill the Password field
  await page.getByPlaceholder('Password').fill('admin');

  // 4. Click the Login button
  // We use the button text because it's a "Login" button
  await page.getByRole('button', { name: 'Login' }).click();

  // 5. Verify successful redirect (Requirement 2.1.1)
  await expect(page).toHaveURL('/home');
});