# AGENTS.md · SvelteKit 2 · Svelte 5 · Drizzle 0.45 · Postgres 16 · Playwright · Vitest 2

## Stack

- **Runtime:** Node.js 22.x LTS, package manager **pnpm 10** via `corepack enable`.
- **Framework:** SvelteKit 2.x on Svelte 5 (runes stable: `$state`, `$derived`, `$effect`).
- **Database:** Postgres 16, accessed via **Drizzle ORM 0.45+** with the `postgres-js` driver.
- **Testing:** Vitest 2 (unit and component via `@testing-library/svelte`), Playwright 1.60+ (E2E).
- **Typescript:** strict mode. `svelte-check` in CI alongside `tsc --noEmit`.

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 5173; kill stale: `lsof -ti :5173 | xargs -r kill -9`)
- Build: `pnpm build` (Vite production build, adapter output in `build/`)
- Preview: `pnpm preview` (serves the built app, port 4173)
- Typecheck: `pnpm check` (`svelte-kit sync && svelte-check`; expect <30s, kill at 2m)
- Lint: `pnpm lint` (`eslint .` + `prettier --check .`)
- Unit tests: `pnpm test:unit` (Vitest, watch). One shot: `pnpm test:unit --run`
- E2E: `pnpm test:e2e` (Playwright; starts the preview server, runs against a Testcontainers Postgres in CI)

DB:
- Generate migration: `pnpm drizzle-kit generate` (writes SQL to `drizzle/migrations/`)
- Apply: `pnpm drizzle-kit migrate` (idempotent; uses `DATABASE_URL`)
- Studio: `pnpm drizzle-kit studio` (port 4983)

Expected runtimes: install ≤90s, dev cold start ≤5s, build ≤60s on a typical app. Anything past 3× is a regression, not flake.

## Architecture

```
src/
├── app.html                # HTML shell. Edit cautiously; applies to all routes.
├── hooks.server.ts         # Handle hook: auth, request logging, error normalization.
├── lib/
│   ├── server/             # BUNDLER BOUNDARY. Never imported into client code.
│   │   ├── db.ts           # Drizzle client + schema export. Singleton.
│   │   └── auth.ts         # Session helpers, password hashing.
│   └── components/         # Reusable .svelte. No business logic, no server imports.
├── routes/
│   ├── +layout.svelte      # Root layout.
│   ├── api/
│   │   └── <resource>/
│   │       └── +server.ts  # Route handler. JSON in, JSON out. Server-only.
│   └── (app)/
│       └── <page>/
│           ├── +page.svelte
│           ├── +page.server.ts  # SSR data load + Form Actions. Server-only.
│           └── +page.ts         # Universal load. Runs on server then client.
└── styles/                 # Global CSS.

drizzle/
├── schema.ts               # Single source of truth for tables.
└── migrations/             # Generated SQL. Never hand-edit.

e2e/                        # Playwright specs.
tests/unit/                 # Vitest unit and component tests.
```

`src/lib/server/` is the bundler boundary. Anything that touches a secret or the DB lives there. Importing it from a `.svelte` file or `+page.ts` is a build error, which is the point.

## Conventions

- **Files:** kebab-case for paths (`user-profile.svelte`); components are `PascalCase.svelte` when reused.
- **Imports:** `$lib/` aliases `src/lib/`. Avoid `../../`.
- **Svelte 5 runes:** `$state`, `$derived`, `$effect` only. No `let count = 0; $: doubled = count * 2;` legacy reactivity in new code.
- **Mutations:** Form Actions in `+page.server.ts`, not API routes. You get progressive enhancement and CSRF protection for free.
- **API routes:** only for non-page JSON consumers (webhooks, mobile clients).
- **Data loading:** `+page.server.ts` when the load touches the DB, a session, or a secret. `+page.ts` only for universal loads (public fetch, computed presentational props).
- **DB queries:** through Drizzle. Compose with `eq`, `and`, `inArray`. Use `db.execute(sql\`\`)` only for what the query builder cannot express.
- **Errors:** throw via `error(404, "Not found")` from `@sveltejs/kit` in load and actions. Custom errors normalize in `hooks.server.ts`'s `handleError`.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/unit/`. E2E under `e2e/`.
- **Run one file:** `pnpm test:unit --run path/to/file.test.ts`. TDD: `pnpm test:unit`.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. **Never mock Drizzle.** Point at a real Postgres via Testcontainers. Mocked-Drizzle tests pass while production SQL is broken.
- **Component tests:** `@testing-library/svelte`. Test what the user sees, not implementation.
- **Playwright:** one `test.describe` per route. Use `page.getByRole` over CSS selectors. Run against the preview build, not dev.

## Ops

- **Hosting:** Vercel (`@sveltejs/adapter-vercel`) or a Node host via `@sveltejs/adapter-node`. Cloudflare Pages via `adapter-cloudflare` if every route fits the Workers runtime.
- **Health check:** expose `src/routes/api/health/+server.ts` returning `{ ok: true, sha: $env.PUBLIC_GIT_SHA }`. Wire it to the platform's readiness probe.
- **Observability:** `@sentry/sveltekit` covers `handle`, `handleError`, and client-side errors. Pair with `@opentelemetry/instrumentation-pg` if you want DB span detail.
- **CI:** GitHub Actions with `actions/setup-node@v4` + pnpm store cache (`~/.local/share/pnpm/store`). Workflow: `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm test:unit --run` → `pnpm build` → `pnpm test:e2e`.
- **Migrations:** `pnpm drizzle-kit migrate` runs as a deploy hook (Vercel build step or a one-shot job before swapping containers). Never on app boot. Roll forward; rollback by writing a new migration.
- **Logging:** `console.*` for structured JSON on Vercel and Cloudflare. On Node hosts, plug `pino` into `hooks.server.ts`.

## External APIs

Use SvelteKit's first-party env modules. `$env/static/private` is server-only and inlined at build time; `$env/static/public` is the only path that ships to the browser. Validate the schema in `src/lib/server/env.ts` with Zod and import the typed object everywhere. SvelteKit will refuse to bundle private env into client code, which catches most leaks at build time.

For runtime config (different values per region or after deploy), use `$env/dynamic/private`. Wire Doppler, Vault, or Infisical into the process for centralized rotation if your org needs it.

*Authsome*: declare providers (`@authsome/resend`, `@authsome/stripe`) and load credentials from `~/.authsome/` instead of env, so rotation does not require a redeploy. See [authsome.dev](https://authsome.dev).

## Don't

- Don't load session-bound data in `+page.ts`. It runs on the client too and leaks the fetch path. Use `+page.server.ts`.
- Don't keep mutable state in module scope inside `+page.server.ts`. Each `load()` may run concurrently across requests; module-level variables become a cross-request race.
- Don't return non-serializable data from `load()` (functions, class instances, `Map`, `Date` is fine via devalue but custom classes are not). The client hydration will throw.
- Don't import `$lib/server/*` from a `.svelte`, `+page.ts`, or `+layout.ts`. The bundler refuses; if you bypass it, secrets ship.
- Don't paginate with `OFFSET` for tables expected to grow past 10k rows. Use keyset (`WHERE id > :last_id ORDER BY id LIMIT 20`).
- Don't reach for stores when runes plus `$page.data` cover it. Svelte 5 makes most stores unnecessary.

## Vendor notes

- **Codex / agents.md:** canonical. Stays under the 32 KiB Codex max.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty, or point each rule at this file via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. Nested AGENTS.md per route group is ignored.
- **Aider:** does not auto-discover AGENTS.md yet. `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** does not read AGENTS.md natively. Symlink: `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [SveltyCMS/SveltyCMS](https://github.com/SveltyCMS/SveltyCMS/blob/main/AGENTS.md) · [kunkunsh/kunkun](https://github.com/kunkunsh/kunkun/blob/main/AGENTS.md) · [javedh-dev/tracktor](https://github.com/javedh-dev/tracktor/blob/main/AGENTS.md)
