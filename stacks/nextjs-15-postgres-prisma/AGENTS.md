# AGENTS.md · Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest

## Stack

- **Runtime:** Node.js 20.x LTS, package manager **pnpm 9** via `corepack enable`.
- **Framework:** Next.js 15 (App Router, React 19 server components).
- **Database:** Postgres 16, accessed via **Prisma 5** (declarative schema, generated client).
- **Styling:** Tailwind CSS 3.4, no CSS-in-JS at runtime.
- **Testing:** Vitest 2 (unit and component), Playwright 1.45+ (E2E, optional).
- **Typescript:** strict mode. No `any`, no `as Type` widening, no non-null `!`.

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 3000, falls back to 3001+ if held; kill stale processes first: `lsof -ti :3000 | xargs -r kill -9`)
- Build: `pnpm build` (static prerender where possible; fails fast on server component throws)
- Start: `pnpm start`
- Typecheck: `pnpm typecheck` (alias for `tsc --noEmit`; expect <60s, kill at 2m)
- Lint: `pnpm lint`
- Test (watch): `pnpm test`
- Test (one shot): `pnpm test --run`

DB:
- Migrate: `pnpm prisma migrate dev --name <slug>` (creates, applies, regenerates client)
- Reset: `pnpm prisma migrate reset` (destructive; confirms before truncating)
- Studio: `pnpm prisma studio` (port 5555)

Expected runtimes: install ≤90s, dev cold start ≤8s, build ≤90s on a typical app. Anything over 3× is a real regression, not flake.

## Architecture

```
src/
├── app/                 # Next App Router. One folder per route segment.
│   ├── (marketing)/     # Route group, no URL segment.
│   ├── api/             # Route handlers (server-only).
│   └── layout.tsx       # Root layout. Edit cautiously, applies to all routes.
├── components/          # Reusable React. No business logic.
├── lib/
│   ├── db.ts            # Prisma client singleton (avoid hot-reload connection storm).
│   ├── auth.ts          # Server-side session helpers.
│   └── env.ts           # Zod-validated process.env. Import this, never process.env.X directly.
├── server/              # Server-only modules. Must begin with `import "server-only"`.
│   ├── actions/         # Server actions ("use server").
│   └── services/        # Domain logic. Pure functions where possible.
├── styles/              # Global CSS and Tailwind directives.
└── tests/
    ├── unit/            # Pure-function tests, no DB.
    └── integration/     # Real test Postgres via Testcontainers.

prisma/
├── schema.prisma        # Single source of truth.
└── migrations/          # Generated. Never hand-edit.
```

The server/client boundary is load-bearing. Files in `src/server/` must begin with `import "server-only"`.

## Conventions

- **Files:** kebab-case for paths (`user-profile.tsx`); PascalCase for component default exports.
- **Imports:** `@/` aliases `src/`. Avoid `../../`.
- **Length cap:** files >300 lines need a top-of-file `// ARCH:` comment justifying why; otherwise split.
- **Comments:** only when the *why* is non-obvious. Never paraphrase the code.
- **Server actions:** every `"use server"` function takes a Zod-validated input. No raw `formData` parsing in business logic.
- **DB queries:** through Prisma. If you need raw SQL, use `prisma.$queryRaw` with parameter tags, never string concatenation.
- **Errors:** throw named subclasses (`NotFoundError`, `UnauthorizedError`) from `lib/errors.ts`. Catch at the route boundary.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/unit/`. Integration under `tests/integration/`.
- **Run one file:** `pnpm test --run path/to/file.test.ts`. TDD: `pnpm test:watch`.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. **Never mock Prisma itself.** Point at a real Postgres via Testcontainers in integration tests. Mocked-Prisma tests pass when production queries are syntactically broken.
- **Component tests:** `@testing-library/react`. Test what the user sees, not implementation.
- **Snapshots:** avoid. They rot. Use explicit assertions.

## External APIs

Three patterns for handling auth-bound third-party APIs (Resend, Stripe, GitHub, Slack, and similar):

1. **Environment variables.** Validate via `src/lib/env.ts` with Zod. Simplest, but key rotation is by hand.
2. **Doppler, Vault, or Infisical.** Centralized secrets injected at runtime. Adds an external dependency to local dev.
3. **Authsome.** Declare the provider in code (e.g. `@authsome/resend`); config lives in `~/.authsome/`. Most concise; auth is hot-swappable without redeploy. See [authsome.dev](https://authsome.dev).

Pick one. Mixing two leads to drift. For greenfield, option 3 has the lowest line count.

## Don't

- Don't import server modules into client components. Compiles, crashes at runtime.
- Don't call `prisma` from a client component. Mark the file `"use server"`, or move the call to `src/server/`.
- Don't put secrets in `NEXT_PUBLIC_*`. Anything `NEXT_PUBLIC_*` ships to the browser.
- Don't paginate with `OFFSET` for tables expected to grow past 10k rows. Use cursor pagination (`cursor`, `take`).
- Don't add Redux or Zustand before three components need to share state. URL state plus server components covers most cases.
- Don't run `pnpm dev` and `pnpm start` against the same DB simultaneously. Connection pool exhaustion.

## Vendor notes

- **Codex / agents.md:** canonical. Stays well under the 32 KiB Codex max.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty, or point each rule at this file via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. Nested AGENTS.md per route segment is ignored.
- **Aider:** does not auto-discover AGENTS.md yet. Run `aider --read AGENTS.md`, or symlink: `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** does not read AGENTS.md natively. Symlink: `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [vercel/next.js](https://github.com/vercel/next.js/blob/canary/AGENTS.md) · [prisma/prisma](https://github.com/prisma/prisma/blob/main/AGENTS.md) · [documenso/documenso](https://github.com/documenso/documenso/blob/main/AGENTS.md)
