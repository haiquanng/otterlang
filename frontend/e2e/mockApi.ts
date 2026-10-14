import type { Page } from '@playwright/test'

const API = 'http://localhost:8000'

export const testUser = {
  id: '6f1c2a52-3b5e-4c1f-9f57-0d2b8b0c6a11',
  email: 'otter@example.com',
  display_name: 'Otter',
  skip_top_n: 3000,
}

const token = { access_token: 'test-token', token_type: 'bearer', user: testUser }

/** The Today page heading, whatever the time of day the test runs. */
export const greeting = /^Good (morning|afternoon|evening)/

const emptyToday = { due_now: 0, due_later_today: 0, new_this_week: 0, total_words: 0, recent_documents: [] }

/** Mock the auth API. `signedIn` decides whether the refresh cookie is "valid" on load. */
export async function mockApi(page: Page, { signedIn }: { signedIn: boolean }) {
  let session = signedIn
  await page.route(`${API}/auth/refresh`, (route) =>
    session ? route.fulfill({ json: token }) : route.fulfill({ status: 401, json: { detail: 'Session expired' } }),
  )
  await page.route(`${API}/auth/login`, async (route) => {
    const body = route.request().postDataJSON() as { password?: string }
    if (body.password !== 'river-stones-42') {
      return route.fulfill({ status: 401, json: { detail: 'Wrong email or password' } })
    }
    session = true
    return route.fulfill({ json: token })
  })
  await page.route(`${API}/auth/logout`, (route) => {
    session = false
    return route.fulfill({ status: 204 })
  })
  await page.route(`${API}/health`, (route) => route.fulfill({ json: { status: 'ok' } }))
  await page.route(`${API}/today**`, (route) => route.fulfill({ json: emptyToday }))
}
