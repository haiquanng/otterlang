import type { SourceKind, Tag } from '@/lib/schemas'

const tagByKind: Record<SourceKind, Tag> = {
  tech_blog: 'technical',
  ielts: 'ielts',
  other: 'general',
}

/** Words saved from a document inherit a tag from its type. */
export function tagForKind(kind: SourceKind): Tag {
  return tagByKind[kind]
}

export function cambridgeUrl(term: string): string {
  return `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(term.toLowerCase())}`
}

export function translateUrl(term: string): string {
  return `https://translate.google.com/?sl=en&tl=vi&op=translate&text=${encodeURIComponent(term)}`
}
