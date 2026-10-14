import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockItems } from './mockItems'

test('destructive actions ask in an app dialog, never a browser popup', async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native browser dialog opened')
  })
  await mockApi(page, { signedIn: true })
  const items = await mockItems(page)

  await page.goto('/library')
  await page.getByLabel('Add a word or phrase').fill('trade-off')
  await page.getByLabel('Add a word or phrase').press('Enter')
  await page.getByRole('link', { name: /trade-off/ }).click()

  // Cancel and Escape both keep the word.
  await page.getByRole('button', { name: 'Delete' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Delete “trade-off”?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Archive “trade-off”?' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toBeHidden()
  expect(items).toHaveLength(1)

  // Confirming archives it.
  await page.getByRole('button', { name: 'Archive' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible()
  expect(items[0]?.status).toBe('archived')
})
