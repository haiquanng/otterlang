import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockItems } from './mockItems'
import { mockSources } from './mockSources'
import { mockWords } from './mockWords'

async function addDocument(page: Page) {
  await page.goto('/add')
  await page.getByLabel('Title').fill('Caching')
  await page.getByLabel('Text').fill('Invalidating a cache is notoriously difficult.')
  await page.getByRole('button', { name: 'Save document' }).click()
  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()
}

test('mark known, undo, skip, then know the rest', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockSources(page)
  const known = await mockWords(page)
  await addDocument(page)

  await expect(page.getByText('3 left')).toBeVisible()
  const idempotent = page.getByRole('article').filter({ hasText: 'idempotent' })
  await idempotent.getByRole('button', { name: 'I know it' }).click()
  await expect(page.getByText('2 left')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('marked as known')
  expect(known.has('idempotent')).toBe(true)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('3 left')).toBeVisible()
  await expect.poll(() => known.has('idempotent')).toBe(false)

  await page.getByRole('button', { name: 'Skip notoriously' }).click()
  await expect(page.getByText('2 left')).toBeVisible()
  expect(known.has('notoriously')).toBe(false)

  await page.getByRole('button', { name: 'I know the rest' }).click()
  await expect(page.getByRole('heading', { name: 'All done' })).toBeVisible()
  expect([...known].sort()).toEqual(['idempotent', 'invalidate'])
})

test('learn a word: it goes to the library with its sentence and tag', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockSources(page)
  await mockWords(page)
  const items = await mockItems(page)
  await addDocument(page)

  await page.getByRole('button', { name: 'Learn it: Invalidating' }).click()
  await expect(page.getByRole('status')).toContainText('“invalidate” added to your library')
  await expect(page.getByText('2 left')).toBeVisible()
  // The document was added with the default type (Tech blog), so the word is tagged technical.
  expect(items[0]).toMatchObject({ term: 'invalidate', tags: ['technical'] })
  expect(items[0]?.contexts[0]).toMatchObject({ surface: 'Invalidating', sentence: 'Invalidating a cache is hard.' })

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('3 left')).toBeVisible()
  await expect.poll(() => items.length).toBe(0)
})

test('highlights the word inside its sentence', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockSources(page)
  await mockWords(page)
  await addDocument(page)
  const row = page.getByRole('article').filter({ hasText: 'Invalidating a cache is hard.' })
  await expect(row.locator('mark')).toHaveText('Invalidating')
})
