# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server on port 3000
pnpm build            # Production build
pnpm test             # Run tests (Vitest)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome
pnpm check            # Biome lint + format check

# Database (Drizzle + Neon PostgreSQL)
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes directly
pnpm db:studio        # Open Drizzle Studio

# Deployment (Cloudflare Workers)
pnpm deploy           # Deploy to Cloudflare
```

## Architecture

**TanStack Start full-stack React app** deployed on Cloudflare Workers with Neon PostgreSQL.

### Stack
- **Framework**: TanStack Start (TanStack Router with SSR support)
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Linting**: Biome (tabs, double quotes)
- **Deployment**: Cloudflare Workers (wrangler)

### Key Patterns

**File-based routing**: Routes live in `src/routes/`. TanStack Router auto-generates `src/routeTree.gen.ts` - don't edit this file.

**Two database clients exist**:
- `src/db/index.ts` - Drizzle ORM client using `pg` Pool (for server functions)
- `src/db.ts` - Neon serverless client (for edge/serverless contexts)

**Schema location**: `src/db/schema.ts` defines Drizzle tables.

**Root layout**: `src/routes/__root.tsx` wraps all routes with Header component and devtools.

**React Query integration**: Set up in `src/integrations/tanstack-query/` with SSR support via `setupRouterSsrQueryIntegration`.

### Adding shadcn Components

```bash
pnpm dlx shadcn@latest add <component>
```

### Demo Files

Files prefixed with `demo` are examples and can be deleted.
