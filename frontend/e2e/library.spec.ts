import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockItems } from './mockItems'

test('quick-add, search, filter, edit and delete a word', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockItems(page)

  await page.goto('/library')
  await expect(page.getByText('Your library is empty')).toBeVisible()

  const quickAdd = page.getByLabel('Add a word or phrase')
  await quickAdd.fill('idempotent')
  await quickAdd.press('Enter')
  await expect(page.getByText('“idempotent” added')).toBeVisible()
  await quickAdd.fill('backward compatibility')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('link', { name: /backward compatibility/ })).toBeVisible()
  await expect(page.getByText('Giving the same result when repeated.')).toBeVisible()

  await page.getByLabel('Search your words').fill('backward')
  await expect(page.getByRole('link', { name: /idempotent/ })).toHaveCount(0)
  await page.getByLabel('Search your words').fill('')

  await page.getByRole('link', { name: /backward compatibility/ }).click()
  await expect(page.getByRole('heading', { name: 'backward compatibility' })).toBeVisible()
  await page.getByLabel('Definition').fill('Old clients keep working after a change.')
  await page.getByRole('button', { name: 'Technical' }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Library' }).first().click()
  await page.getByRole('button', { name: 'Technical' }).click()
  await expect(page.getByRole('link', { name: /idempotent/ })).toHaveCount(0)
  await page.getByRole('link', { name: /backward compatibility/ }).click()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()
  await expect(page.getByRole('link', { name: /backward compatibility/ })).toHaveCount(0)
})
