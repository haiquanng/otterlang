import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockLibrary } from './mockLibrary'
import { mockSources } from './mockSources'
import { mockWords } from './mockWords'

test('a new learner opens a ready-made text from Today and lands on Pick words', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const sources = await mockSources(page)
  await mockLibrary(page, sources)
  await mockWords(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Start with a ready-made text' })).toBeVisible()
  await expect(page.getByText('Wikipedia · CC BY-SA 4.0').first()).toBeVisible()
  await page.getByRole('button', { name: 'Read & pick words: Coral reef' }).click()

  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()
  await expect(page.getByText('Coral reef')).toBeVisible()
  expect(sources.map((s) => s.title)).toEqual(['Coral reef'])
})

test('the full library filters by type and shows Open for texts already added', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const sources = await mockSources(page)
  await mockLibrary(page, sources)
  await mockWords(page)

  await page.goto('/add')
  await page.getByRole('link', { name: /Browse the starter library/ }).click()
  await expect(page.getByRole('heading', { name: 'Starter library' })).toBeVisible()
  await page.getByRole('button', { name: 'IELTS' }).click()
  await expect(page.getByRole('heading', { name: 'Idempotence' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Coral reef' })).toBeVisible()

  await page.getByRole('button', { name: 'Read & pick words: Coral reef' }).click()
  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()
  await page.goto('/starter')
  await expect(page.getByRole('link', { name: 'Open' })).toHaveCount(1)
})

test('after opening one text the rest stay reachable from Documents and Today', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const sources = await mockSources(page)
  await mockLibrary(page, sources)
  await mockWords(page)

  await page.goto('/starter')
  await page.getByRole('button', { name: 'Read & pick words: Idempotence' }).click()
  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()

  await page.goto('/documents')
  await expect(page.getByRole('link', { name: /Idempotence/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'More to read' })).toBeVisible()
  // Suggestions only list texts not opened yet.
  await expect(page.getByRole('button', { name: 'Read & pick words: Idempotence' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Read & pick words: Coral reef' })).toBeVisible()
  await page.getByRole('link', { name: 'Starter library' }).click()
  await expect(page.getByRole('heading', { name: 'Starter library' })).toBeVisible()
})
