import { describe, expect, it } from 'vitest'
import { en } from '@/i18n/en'
import { feedbackMessages } from '@/lib/sentenceFeedback'

describe('feedbackMessages', () => {
  it('maps codes to advice in order and skips unknown ones', () => {
    expect(feedbackMessages(['missing_word', 'mystery', 'no_capital'])).toEqual([
      en.review.issueMissingWord,
      en.review.issueNoCapital,
    ])
  })
})
