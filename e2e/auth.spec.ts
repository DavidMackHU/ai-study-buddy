import { test, expect } from '@playwright/test'

test.describe('Auth flows', () => {
  test('user can register and lands on dashboard', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`

    await page.goto('/register')
    await expect(page.getByText('Create account')).toBeVisible()

    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome back, Test User!')).toBeVisible()
  })

  test('user can log in with valid credentials', async ({ page }) => {
    const email = `login-${Date.now()}@example.com`

    // Register first
    await page.goto('/register')
    await page.getByPlaceholder('Your name').fill('Login User')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('Min. 8 characters').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL('/dashboard')

    // Sign out
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')

    // Log back in
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/dashboard')
  })

  test('login shows error with wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('nobody@example.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
