import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'
import { mockReview } from './mockReview'

test('answer two cards with the keyboard and finish the session', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  const ratings = await mockReview(page)
  await page.goto('/review')

  await expect(page.getByText('Fill the gap')).toBeVisible()
  await expect(page.getByText('1 / 2')).toBeVisible()
  await page.getByRole('button', { name: 'Show hint' }).click()
  await expect(page.getByText('Make something no longer valid.')).toBeVisible()

  const answer = page.getByLabel('Your answer')
  await expect(answer).toBeFocused()
  await answer.fill('invalidating')
  await answer.press('Enter')
  await expect(page.getByRole('status')).toHaveText('Correct')
  await expect(page.locator('mark')).toHaveText('Invalidating')
  await page.keyboard.press('Enter')

  await expect(page.getByText('Which word is this?')).toBeVisible()
  await expect(page.getByText('2 / 2')).toBeVisible()
  await page.getByRole('button', { name: "I don't know" }).click()
  await expect(page.getByRole('status')).toHaveText('Not quite')
  await expect(page.getByText('idempotent', { exact: true })).toBeVisible()
  await page.keyboard.press('1')

  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible()
  await expect(page.getByText('1 of 2 correct.')).toBeVisible()
  expect(ratings.map((r) => [r.rating, r.correct])).toEqual([
    [3, true],
    [1, false],
  ])
})

test('nothing due shows an empty state', async ({ page }) => {
  await mockApi(page, { signedIn: true })
  await mockReview(page, { empty: true })
  await page.goto('/review')
  await expect(page.getByRole('heading', { name: 'Nothing to review' })).toBeVisible()
})
