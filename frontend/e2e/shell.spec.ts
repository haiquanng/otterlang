import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'

test('navigates between the main sections', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()

  await page.getByRole('link', { name: 'Library' }).first().click()
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()

  await page.getByRole('link', { name: 'Add' }).first().click()
  await expect(page.getByRole('heading', { name: 'Add' })).toBeVisible()
})
