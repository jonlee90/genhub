# Agent Notes for GenHub

This file is for agentic coding assistants operating in this repo.
Follow these conventions to keep changes consistent and low-risk.

## Quick Orientation

- Framework: Next.js 15 (App Router) + React 19 + TypeScript.
- Styling: Tailwind CSS with `clsx` + `tailwind-merge` via `cn` helper.
- Data: Supabase (server utilities in `@/utils/supabase/server`).
- Tests: Playwright end-to-end tests in `tests/`.

## Commands (Build, Lint, Test)

### Development

- `npm run dev` — start Next.js dev server.
- `npm run predev` — inject service-worker env (runs before dev).

### Build & Start

- `npm run build` — production build.
- `npm run start` — start production server.

### Lint & Typecheck

- `npm run lint` — Next.js ESLint checks.
- `npm run lint:ts` — TypeScript typecheck (`tsc --noEmit`).
- Run lint on a file: `npm run lint -- --file app/app/materials/page.tsx`.

### Tests (Playwright)

- `npm test` — run all Playwright tests.
- `npm run test:headed` — run tests with headed browser.
- `npm run test:ui` — open Playwright UI.
- `npm run test:debug` — debug mode.
- `npm run test:report` — show report.

### Single Test Execution

- Full file: `npx playwright test tests/chat.spec.ts`.
- By name: `npx playwright test -g "My test name"`.
- Via npm script: `npm run test -- tests/chat.spec.ts`.

## Repo Layout

- `app/` — Next.js app router pages and layouts.
- `components/` — shared UI components.
- `lib/` — shared utilities, auth, config, types.
- `utils/` — helpers (Supabase utilities, etc.).
- `tests/` — Playwright E2E tests.
- `scripts/` — node/tsx scripts (db, docs, deps).

## Code Style Guidelines

### Imports

- Order imports: external → internal alias (`@/`) → relative.
- Prefer direct imports over barrel files when possible.
- Use `@/` alias for internal paths (configured in `tsconfig.json`).

### Formatting

- Follow the existing style in the file you edit.
- Many components follow the shadcn style: double quotes, no semicolons.
- Avoid reformatting unrelated lines.
- There is no repo-level Prettier config; keep formatting minimal.

### TypeScript

- `strict: true` in `tsconfig.json`.
- Prefer explicit types on public APIs and props.
- Avoid `any`; ESLint allows it but use it only when unavoidable.
- Use `type` imports (`import type { Foo } from "..."`) where appropriate.

### React / Next.js

- Server components by default; add `"use client"` only when needed.
- Minimize data passed into client components (serialize small objects).
- Fetch data in parallel with `Promise.all` when independent.
- Use `redirect()` for auth gating in server components.
- For heavy client components, consider `next/dynamic`.

### Naming

- Components: `PascalCase`.
- Hooks: `useSomething`.
- Functions/variables: `camelCase`.
- Files: match component name (`MyWidget.tsx`).

### Error Handling

- Prefer early returns and explicit checks.
- Use `try/catch` in server actions or when calling external services.
- Log with `console.error` and return safe fallbacks for UI rendering.
- When returning data from server actions, include an `error` field if used.

### UI / Styling

- Use Tailwind utility classes for styling.
- Combine class names with the `cn` helper from `@/lib/utils`.
- Prefer reusable variants via `class-variance-authority` when appropriate.

## ESLint Rules (Key Overrides)

- `react/no-unescaped-entities`: off.
- `@next/next/no-page-custom-font`: off.
- `@typescript-eslint/no-unused-vars`: warn (underscored vars allowed).
- `@typescript-eslint/no-explicit-any`: off (avoid anyway).
- `@next/next/no-img-element`: warn (prefer `next/image`).
- `@typescript-eslint/ban-ts-comment`: warn; `ts-ignore` needs description.
- `@typescript-eslint/no-non-null-assertion`: off.

## Data & Auth Patterns

- Use `auth()` from `@/lib/auth` in server components.
- Use Supabase client from `@/utils/supabase/server` on the server.
- Avoid exposing sensitive fields to the client.

## Testing Notes

- Playwright tests live in `tests/`.
- Prefer running a single test file first.
- If adding tests, keep them deterministic and avoid external dependencies.

## Tooling Notes

- Node scripts live in `scripts/` and use `tsx` when needed.
- Database scripts: `npm run db:setup`, `npm run db:test`, `npm run db:gen-types`.
- Docker scripts exist under `npm run docker:*`.

## Cursor/Copilot Rules

- No `.cursorrules` or `.cursor/rules/*` found in this repo.
- No `.github/copilot-instructions.md` found in this repo.

## Change Hygiene

- Keep edits scoped to the task.
- Do not introduce unrelated refactors.
- Avoid large-scale formatting changes.
- Add docs only when the change introduces new behavior.
