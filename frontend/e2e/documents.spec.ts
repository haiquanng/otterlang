import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockSources } from './mockSources'
import { mockWords } from './mockWords'

const BODY = 'Invalidating a cache is one of the hardest problems in computing.\n\nThe trade-off is latency.'

test('add a document, read it, find it in the list, delete it', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockSources(page)
  await mockWords(page)

  await page.goto('/documents')
  await expect(page.getByText('No documents yet')).toBeVisible()
  await page.getByRole('link', { name: 'Add your first document' }).click()

  await page.getByLabel('Title').fill('Caching at the edge')
  await page.getByText('IELTS', { exact: true }).click()
  await page.getByLabel('Text').fill(BODY)
  await page.getByRole('button', { name: 'Save document' }).click()

  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to document' }).click()
  await expect(page.getByRole('heading', { name: 'Caching at the edge' })).toBeVisible()
  await expect(page.getByText('The trade-off is latency.')).toBeVisible()

  await page.getByRole('link', { name: 'All documents' }).click()
  await expect(page.getByRole('link', { name: /Caching at the edge/ })).toBeVisible()
  await page.getByRole('link', { name: /Caching at the edge/ }).click()

  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No documents yet')).toBeVisible()
})

test('save is disabled until title and text are filled', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockSources(page)
  await page.goto('/add')
  const save = page.getByRole('button', { name: 'Save document' })
  await expect(save).toBeDisabled()
  await page.getByLabel('Title').fill('Only a title')
  await expect(save).toBeDisabled()
  await page.getByLabel('Text').fill('Some text')
  await expect(save).toBeEnabled()
})
