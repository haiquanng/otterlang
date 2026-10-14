import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'

test.use({ colorScheme: 'dark' })

test('switch theme, survive a reload, and go back to the system setting', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/settings')
  const html = page.locator('html')
  const paper = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  // OS is dark and nothing is chosen yet: dark tokens, no override.
  await expect(page.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')
  expect(await paper()).toBe('rgb(21, 23, 26)')

  await page.getByRole('radio', { name: 'Light' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  expect(await paper()).toBe('rgb(251, 248, 243)')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fbf8f3')

  await page.getByRole('radio', { name: 'System' }).click()
  await expect(html).not.toHaveAttribute('data-theme')
  expect(await paper()).toBe('rgb(21, 23, 26)')
})
