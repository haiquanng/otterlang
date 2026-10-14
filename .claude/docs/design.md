# Design guide

Experience is a core requirement. Priority order: web desktop, then responsive mobile, then PWA polish.

## Feel
Calm, focused, warm. A study desk, not a game. Reading long English text must be comfortable; reviewing must be fast and keyboard-friendly.

## Layout
- Desktop (md and up): left sidebar 240px with the primary "Add" action on top, content column max 768px (`max-w-3xl`), generous whitespace.
- Mobile: bottom tab bar (Today, Library, Add, Documents, Settings) with Add as the raised center button. Respect `safe-area-inset-bottom`.
- Reading view (documents): serif `font-reading`, 17-18px, line-height 1.7, max ~70 characters per line.

## Tokens (`frontend/src/index.css`)
- Surfaces: `paper` (page), `surface` (cards, sidebar), `line` (borders)
- Text: `ink`, `muted`
- Accents: `river` (primary actions, active state), `otter` (warm highlights, saved words), soft variants for backgrounds
- `danger` for destructive actions and errors
- Light by default, dark follows the OS. Components use tokens only, so a theme switch later only redefines variables.

## Interaction rules
- Tap targets at least 44px (`min-h-11`).
- Every screen handles loading, empty, error and "server waking up" states. Empty states explain the next action, with a button for it.
- Review is keyboard-first on desktop: Enter submits, 1-4 rate, Space reveals.
- Highlight saved words inside the source text; tapping one opens its card.
- Motion is subtle (150-200ms), and respects `prefers-reduced-motion`.
- No streak guilt, no confetti walls. Progress is shown plainly.

## Accessibility
- WCAG AA contrast for text on every token pair.
- Icons that stand alone carry `aria-label`; decorative icons are `aria-hidden`.
- Visible focus ring on all interactive elements.
