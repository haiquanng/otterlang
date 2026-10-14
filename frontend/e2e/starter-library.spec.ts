import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockLibrary } from './mockLibrary'
import { mockSources } from './mockSources'
import { mockWords } from './mockWords'

test('a new learner opens a ready-made text from Today, reads it, then picks words', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const sources = await mockSources(page)
  await mockLibrary(page, sources)
  await mockWords(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Start with a ready-made text' })).toBeVisible()
  await expect(page.getByText('Wikipedia · CC BY-SA 4.0').first()).toBeVisible()
  await page.getByRole('button', { name: 'Read: Coral reef' }).click()

  // The reading view first, not Pick words.
  await expect(page.getByRole('heading', { name: 'Coral reef' })).toBeVisible()
  await expect(page.getByText('Coral reefs are underwater ecosystems')).toBeVisible()
  expect(sources.map((s) => s.title)).toEqual(['Coral reef'])

  await page.getByRole('link', { name: 'Pick words' }).click()
  await expect(page.getByRole('heading', { name: 'Pick words to learn' })).toBeVisible()
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

  await page.getByRole('button', { name: 'Read: Coral reef' }).click()
  await expect(page.getByRole('heading', { name: 'Coral reef' })).toBeVisible()
  await page.goto('/starter')
  await page.getByRole('link', { name: 'Open' }).click()
  await expect(page.getByRole('heading', { name: 'Coral reef' })).toBeVisible()
})

test('after opening one text the rest stay reachable from Documents and Today', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const sources = await mockSources(page)
  await mockLibrary(page, sources)
  await mockWords(page)

  await page.goto('/starter')
  await page.getByRole('button', { name: 'Read: Idempotence' }).click()
  await expect(page.getByRole('heading', { name: 'Idempotence' })).toBeVisible()

  await page.goto('/documents')
  await expect(page.getByRole('link', { name: /Idempotence/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'More to read' })).toBeVisible()
  // Suggestions only list texts not opened yet.
  await expect(page.getByRole('button', { name: 'Read: Idempotence' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Read: Coral reef' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Starter library' }).click()
  await expect(page.getByRole('heading', { name: 'Starter library' })).toBeVisible()
})

test('desktop sidebar links to the starter library; the mobile tab bar keeps five tabs', async ({ page }, info) => {
  await mockApi(page, { signedIn: true })
  await mockLibrary(page, await mockSources(page))
  await page.goto('/settings')
  // Server status is no longer shown in Settings.
  await expect(page.getByText('Server')).toHaveCount(0)

  if (info.project.name === 'desktop') {
    await page.getByRole('complementary').getByRole('link', { name: 'Starter library' }).click()
    await expect(page.getByRole('heading', { name: 'Starter library' })).toBeVisible()
  } else {
    await expect(page.getByRole('navigation').getByRole('listitem')).toHaveCount(5)
  }
})
