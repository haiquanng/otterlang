import { expect, test, type Page } from '@playwright/test'
import { greeting, mockApi } from './mockApi'

const API = 'http://localhost:8000'

async function mockToday(page: Page, data: Record<string, unknown>) {
  // Registered after mockApi, so it takes precedence over the empty default.
  await page.route(`${API}/today**`, (route) =>
    route.fulfill({ json: { due_now: 0, due_later_today: 0, new_this_week: 0, total_words: 0, recent_documents: [], ...data } }),
  )
}

test('new learner is pointed at adding a document', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: greeting })).toContainText('Otter')
  await page.getByRole('link', { name: 'Add a document' }).click()
  await expect(page.getByRole('heading', { name: 'Add a document' })).toBeVisible()
})

test('due cards lead to the review session', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockToday(page, {
    due_now: 7,
    due_later_today: 2,
    new_this_week: 5,
    total_words: 40,
    recent_documents: [
      { id: '7b8f0c1e-1d2a-4c3b-9e4f-5a6b7c8d9e0f', title: 'Why cache invalidation is hard', kind: 'tech_blog', url: null, char_count: 2400, created_at: '2026-10-14T03:00:00Z' },
    ],
  })
  await page.route(`${API}/review/due**`, (route) => route.fulfill({ json: [] }))
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '7 cards to review' })).toBeVisible()
  await expect(page.getByText('2 more due later today')).toBeVisible()
  await expect(page.getByText('40')).toBeVisible()
  await expect(page.getByRole('link', { name: /Why cache invalidation is hard/ })).toBeVisible()
  await page.getByRole('link', { name: 'Start review' }).click()
  await expect(page).toHaveURL(/\/review$/)
})

test('nothing due shows caught up', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockToday(page, { total_words: 12, due_later_today: 3 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'All caught up' })).toBeVisible()
  await expect(page.getByText('3 more due later today')).toBeVisible()
})
