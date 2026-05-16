import { test, expect } from '@playwright/test'

async function registerAndLogin(page: import('@playwright/test').Page, name: string) {
  const email = `dash-${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByPlaceholder('Your name').fill(name)
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('Min. 8 characters').fill('password123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/dashboard')
}

test.describe('Dashboard', () => {
  test('shows stats strip after login', async ({ page }) => {
    await registerAndLogin(page, 'Stats User')

    await expect(page.getByText('Day streak')).toBeVisible()
    await expect(page.getByText('XP earned')).toBeVisible()
    await expect(page.getByText('Hours studied')).toBeVisible()
    await expect(page.getByText('Cards reviewed')).toBeVisible()
  })

  test('shows navigation links', async ({ page }) => {
    await registerAndLogin(page, 'Nav User')

    await expect(page.getByText('AI Study Buddy')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('shows subject prompt when no subject selected', async ({ page }) => {
    await registerAndLogin(page, 'Prompt User')

    await expect(page.getByText(/Select a subject from the sidebar/)).toBeVisible()
  })
})
