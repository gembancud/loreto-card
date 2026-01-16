# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Production build (outputs to .output/)
pnpm test             # Run tests (Vitest)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome
pnpm check            # Biome lint + format check

# Database (Drizzle + PostgreSQL)
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes directly
pnpm db:studio        # Open Drizzle Studio

# Production
pnpm start            # Run production server (after build)
```

## Architecture

**TanStack Start full-stack React app** deployed on Railway with PostgreSQL.

### Stack
- **Framework**: TanStack Start (TanStack Router with SSR support)
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Linting**: Biome (tabs, double quotes)
- **Deployment**: Railway (Node.js)

### Key Patterns

**File-based routing**: Routes live in `src/routes/`. TanStack Router auto-generates `src/routeTree.gen.ts` - don't edit this file.

**Database client**: `src/db/index.ts` - Drizzle ORM client using `pg` Pool (for server functions)

**Schema location**: `src/db/schema.ts` defines Drizzle tables.

**Root layout**: `src/routes/__root.tsx` wraps all routes with Header component and devtools.

**React Query integration**: Set up in `src/integrations/tanstack-query/` with SSR support via `setupRouterSsrQueryIntegration`.

### Authentication

**OTP-based auth** using phone numbers. Key files:
- `src/lib/session.ts` - Session config using `@tanstack/react-start/server` useSession
- `src/data/auth/session.ts` - Server functions: `getSessionData`, `getCurrentUser`, `logout`
- `src/data/auth/otp.ts` - OTP send/verify server functions
- `src/routes/login.tsx` - Login page with phone + OTP flow

**Protected routes**: Use `_authed.tsx` layout route which checks session in `beforeLoad` and redirects to `/login` if not authenticated.

**User roles**: `superuser`, `admin`, `user` (defined in schema). Check with `isAdmin()` helper from `src/data/auth/session.ts`.

**After login/logout**: Call `router.invalidate()` to refresh loaders, then `router.navigate()` for client-side redirect.

### Adding shadcn Components

```bash
pnpm dlx shadcn@latest add <component>
```

# Project Notes

## shadcn Components
Claude cannot add shadcn components due to network restrictions. User must manually run:
```bash
pnpm dlx shadcn@latest add <component>
```

## Catching Import/Type Errors
Biome lint does NOT catch missing imports or type errors. Use:
- `pnpm build` - full build catches all errors
- `tsc --noEmit` - typecheck only (faster)

## Code Navigation with LSP
Prefer LSP tool over Grep/Read for precise code intelligence:
- **findReferences** - Find all usages of a function/variable (better than grep for refactoring)
- **goToDefinition** - Jump to where something is defined (faster than searching)
- **hover** - Get type info without reading entire file
- **incomingCalls/outgoingCalls** - Understand call relationships

Use Grep for: text search, finding patterns across files, searching comments/strings.
Use LSP for: type-aware navigation, refactoring impact analysis, understanding code structure.

## Git Commits with Multi-line Messages
Use multi-line strings in double quotes (heredocs fail in sandbox):
```bash
git commit -m "Subject line

Body text here"
```

