# Repository Guidelines

## Project Structure & Module Organization
`src/routes` holds TanStack Router file-based routes; filenames encode layouts and params such as `_authed/benefits/$benefitId.tsx`. Shared UI lives in `src/components`, with feature folders like `people`, `qr`, `activity`, and `id-card`; reusable primitives stay in `src/components/ui`. Data access and server logic live in `src/data`, while database schema and seed code live in `src/db`. Drizzle migrations are stored in `drizzle/`, static assets in `public/`, and reference material in `docs/`. Do not hand-edit `src/routeTree.gen.ts`.

## Build, Test, and Development Commands
Use `pnpm` for all local work.

- `pnpm dev`: start the Vite dev server on port `3000`.
- `pnpm build`: create the production build.
- `pnpm preview`: serve the built client locally.
- `pnpm start`: run the generated Nitro server from `.output/server/index.mjs`.
- `pnpm test`: run the Vitest suite.
- `pnpm lint`, `pnpm format`, `pnpm check`: run Biome linting, formatting, and combined checks.
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`: manage Drizzle migrations and seed data.

## Coding Style & Naming Conventions
This repo uses TypeScript, React, and ESM. Biome enforces tabs for indentation and double quotes for JavaScript/TypeScript; run `pnpm check` before opening a PR. Use PascalCase for React components (`AddPersonDialog.tsx`), camelCase for helpers and utilities, and TanStack route naming for route files. Prefer `@/` imports for app modules. Keep generated files and migration snapshots out of manual cleanup unless the task requires them.

## Testing Guidelines
Vitest and Testing Library are configured, but there are currently no committed `*.test.*` files. Add tests with new behavior, especially for route loaders, `src/data` modules, and stateful UI flows. Place tests close to the code they cover using names like `component.test.tsx` or `people.test.ts`. Run `pnpm test` locally before submitting changes.

## Commit & Pull Request Guidelines
Recent history uses short, imperative, sentence-case commit subjects such as `Add barangay staff roles...` and `Allow barangay staff to manage people...`. Keep commits focused on one change. PRs should include a concise summary, linked task or issue, screenshots for UI changes, and notes for any schema, seed, or environment updates. If `src/db/schema.ts` changes, include the matching migration under `drizzle/`.

## Security & Configuration Tips
Start from `.env.example` and keep local secrets in `.env.local`. `drizzle.config.ts` loads `.env.local` first, then `.env`. Never commit real database, session, SMS, or S3 credentials.
