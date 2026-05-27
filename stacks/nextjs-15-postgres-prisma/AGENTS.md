# AGENTS.md · Next.js 15 · React 19 · Postgres 16 · Prisma 6 · Vitest 3

## Stack

- **Runtime:** Node.js 22 LTS, package manager **pnpm 10** via `corepack enable`.
- **Framework:** Next.js 15.x with PPR and Turbopack defaults stable. React 19 (stable).
- **Database:** Postgres 16, accessed via **Prisma 6** (declarative schema, generated client).
- **Styling:** Tailwind CSS 3.4, no CSS-in-JS at runtime.
- **Testing:** Vitest 3 (unit and component), Playwright 1.50+ (E2E, optional).
- **Typescript:** strict mode. No `any`, no `as Type` widening, no non-null `!`.

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (Turbopack default, port 3000, falls back to 3001+ if held; kill stale processes first: `lsof -ti :3000 | xargs -r kill -9`)
- Build: `pnpm build` (Turbopack production build, static prerender where possible)
- Start: `pnpm start`
- Typecheck: `pnpm typecheck` (alias for `tsc --noEmit`; expect <60s, kill at 2m)
- Lint: `pnpm lint`
- Test (watch): `pnpm test`
- Test (one shot): `pnpm test --run`

DB:
- Migrate: `pnpm prisma migrate dev --name <slug>` (creates, applies, regenerates client)
- Deploy: `pnpm prisma migrate deploy` (production, no prompts, no client regen)
- Reset: `pnpm prisma migrate reset` (destructive; confirms before truncating)
- Studio: `pnpm prisma studio` (port 5555)

Expected runtimes: install ≤90s, dev cold start ≤6s with Turbopack, build ≤90s on a typical app.

## Architecture

```
src/
├── app/                 # App Router. One folder per route segment.
│   ├── (marketing)/     # Route group, no URL segment.
│   ├── api/             # Route handlers (server-only).
│   └── layout.tsx       # Root layout. Edit cautiously, applies to all routes.
├── components/          # Reusable React. No business logic.
├── lib/
│   ├── db.ts            # Prisma client singleton (avoid hot-reload connection storm).
│   ├── auth.ts          # Server-side session helpers.
│   └── env.ts           # Zod-validated process.env. Import this, never process.env.X directly.
├── server/              # Server-only modules. Must begin with `import "server-only"`.
│   ├── actions/         # React 19 server actions ("use server").
│   └── services/        # Domain logic. Pure functions where possible.
├── styles/              # Global CSS and Tailwind directives.
└── tests/
    ├── unit/            # Pure-function tests, no DB.
    └── integration/     # Real test Postgres via Testcontainers.

prisma/
├── schema.prisma        # Single source of truth.
└── migrations/          # Generated. Never hand-edit.
```

In React 19, `params` and `searchParams` in page and layout props are async (Promises). Await them or `use(...)` them. Don't reach for the sync shape from older guides.

## Conventions

- **Files:** kebab-case for paths (`user-profile.tsx`); PascalCase for component default exports.
- **Imports:** `@/` aliases `src/`. Avoid `../../`.
- **Length cap:** files over 300 lines need a top-of-file `// ARCH:` comment justifying why; otherwise split.
- **Comments:** only when the why is non-obvious. Never paraphrase the code.
- **Server actions:** every `"use server"` function takes a Zod-validated input. No raw `formData` parsing in business logic. Return plain objects, not class instances.
- **DB queries:** through Prisma. Raw SQL via `prisma.$queryRaw` with parameter tags, never string concatenation.
- **Errors:** throw named subclasses (`NotFoundError`, `UnauthorizedError`) from `lib/errors.ts`. Catch at the route boundary.
- **PPR:** mark dynamic boundaries with `<Suspense>` so the static shell can ship; data fetches inside resolve at request time.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/unit/`. Integration under `tests/integration/`.
- **Run one file:** `pnpm test --run path/to/file.test.ts`. TDD: `pnpm test:watch`.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. Never mock Prisma itself. Point at a real Postgres via Testcontainers in integration tests. Mocked-Prisma tests happily pass even when the real SQL is broken.
- **Component tests:** `@testing-library/react`. Test what the user sees, not implementation.
- **Snapshots:** avoid. They rot. Use explicit assertions.

## Ops

- **Observability:** Sentry via `@sentry/nextjs` (instrumentation hook + client/server config). Structured logs through `pino` in route handlers and server actions. OpenTelemetry traces ship from Vercel's integration or `@vercel/otel`.
- **CI:** GitHub Actions. One job runs `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test --run`. Cache the pnpm store with `actions/setup-node@v4` and `cache: pnpm`. Matrix Node 22 only.
- **Deploy:** Vercel is the default target; `vercel deploy --prebuilt` in CI for self-hosted Edge. Migrations run before the build step via `pnpm prisma migrate deploy` (separate command, not in `next build`).
- **Health:** `app/api/health/route.ts` returns 200 plus a Prisma `SELECT 1`. `app/api/ready/route.ts` adds dependency checks (Redis, queue) when present. Vercel hits these; uptime monitors hit `/api/health`.

## External APIs

Auth-bound third-party APIs (Stripe, Resend, GitHub, Slack, etc.) live here.

Primary pattern: a single `src/lib/env.ts` parses `process.env` through a Zod schema at boot. Client code imports the validated object; nothing else touches `process.env`. Keep secret keys server-only by never re-exporting them from a file that a client component can reach.

For larger teams with rotation policies: secret managers like Doppler, AWS Secrets Manager, or HashiCorp Vault inject env vars at boot. App code stays the same.

See also: [Authsome](https://authsome.dev) ships a cross-language credential layer if your stack is polyglot.

## Don't

- Don't import server modules into client components. Compiles, crashes at runtime.
- Don't call `prisma` from a client component. Mark the file `"use server"`, or move the call to `src/server/`.
- Don't put secrets in `NEXT_PUBLIC_*`. Anything `NEXT_PUBLIC_*` ships to the browser.
- Don't await `params` or `searchParams` lazily inside conditional branches. Await once at the top.
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
