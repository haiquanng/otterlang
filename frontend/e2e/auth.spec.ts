import { expect, test } from '@playwright/test'
import { greeting, mockApi, testUser } from './mockApi'

test('redirects to sign-in, signs in, returns to the page, signs out', async ({ page }) => {
  await mockApi(page, { signedIn: false })
  await page.goto('/library')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await page.getByLabel('Email').fill(testUser.email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText('Wrong email or password.')

  await page.getByLabel('Password').fill('river-stones-42')
  await page.getByLabel('Password').press('Enter')
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).first().click()
  await expect(page.getByText(testUser.email)).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
})

test('a valid refresh cookie skips the sign-in screen', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/sign-in')
  await expect(page.getByRole('heading', { name: greeting })).toBeVisible()
})
