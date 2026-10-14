import { en } from '@/i18n/en'

const messages: Record<string, string> = {
  missing_word: en.review.issueMissingWord,
  too_short: en.review.issueTooShort,
  no_capital: en.review.issueNoCapital,
  no_end_punctuation: en.review.issueNoPunctuation,
}

/** Advice for each issue code from the writing-card check; unknown codes are skipped. */
export function feedbackMessages(issues: string[]): string[] {
  return issues.flatMap((code) => (messages[code] ? [messages[code]] : []))
}
