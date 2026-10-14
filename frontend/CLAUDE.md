# Frontend (React PWA)

Loaded when working under `frontend/`. Root `CLAUDE.md`, `.claude/rules/` and `.claude/docs/design.md` still apply.

## Commands (run from `frontend/`)
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint` (oxlint)
- Unit tests: `npm test` (Vitest)
- PWA icons from `public/favicon.svg`: `npm run pwa-assets`

## Layout
- `src/App.tsx` router and query client
- `src/components/` shared UI, one component per file (`AppShell`, `Sidebar`, `BottomTabs`, ...)
- `src/pages/` one file per route
- `src/lib/api.ts` the only place that calls `fetch`; every response parsed with Zod
- `src/lib/nav.ts` navigation items shared by sidebar and bottom tabs
- `src/i18n/en.ts` all UI text
- `src/index.css` design tokens (CSS variables mapped into Tailwind via `@theme`)

## Notes
- Deployed on Vercel with root directory `frontend/`. `vercel.json` rewrites all paths to `index.html` for client routing.
- Use token classes (`bg-paper`, `text-muted`, `bg-river`, ...), never raw hex in components.
