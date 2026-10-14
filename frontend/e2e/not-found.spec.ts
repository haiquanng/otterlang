import { expect, test } from '@playwright/test'
import { greeting, mockApi } from './mockApi'

test('unknown paths show a friendly page inside the app', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/this/does/not/exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Go to Today' }).click()
  await expect(page.getByRole('heading', { name: greeting })).toBeVisible()
})
