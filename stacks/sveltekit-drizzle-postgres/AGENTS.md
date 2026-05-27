# AGENTS.md · SvelteKit 2 · Svelte 5 · Drizzle 0.30 · Postgres 16 · Playwright · Vitest

## Stack

- **Runtime:** Node.js 20.x LTS, package manager **pnpm 9** via `corepack enable`.
- **Framework:** SvelteKit 2.x on Svelte 5 (runes: `$state`, `$derived`, `$effect`).
- **Database:** Postgres 16, accessed via **Drizzle ORM 0.30+** with the `postgres-js` driver.
- **Testing:** Vitest 2 (unit, component via `@testing-library/svelte`), Playwright 1.45+ (E2E).
- **Typescript:** strict mode. `svelte-check` in CI alongside `tsc --noEmit`.

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 5173; kill stale: `lsof -ti :5173 | xargs -r kill -9`)
- Build: `pnpm build` (Vite production build, adapter output in `build/`)
- Preview: `pnpm preview` (serves the built app, port 4173)
- Typecheck: `pnpm check` (alias for `svelte-kit sync && svelte-check`; expect <30s, kill at 2m)
- Lint: `pnpm lint` (`eslint .` + `prettier --check .`)
- Unit tests: `pnpm test:unit` (Vitest, watch). One-shot: `pnpm test:unit --run`
- E2E: `pnpm test:e2e` (Playwright; starts the preview server, runs against a Testcontainers Postgres in CI)

DB:
- Generate migration: `pnpm drizzle-kit generate` (writes SQL to `drizzle/migrations/`)
- Apply: `pnpm drizzle-kit migrate` (idempotent; uses `DATABASE_URL`)
- Studio: `pnpm drizzle-kit studio` (port 4983)

Expected runtimes: install ≤90s, dev cold start ≤5s, build ≤60s on a typical app. Anything over 3× is a regression, not flake.

## Architecture

```
src/
├── app.html                # HTML shell. Edit cautiously, applies to all routes.
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
tests/unit/                 # Vitest unit + component tests.
```

`src/lib/server/` is the bundler boundary. Anything that touches a secret or the DB lives there. Importing it from a `.svelte` file or `+page.ts` is a build error, which is the point.

## Conventions

- **Files:** kebab-case for paths (`user-profile.svelte`); components are `PascalCase.svelte` when reused.
- **Imports:** `$lib/` aliases `src/lib/`. Avoid `../../`.
- **Svelte 5 runes:** `$state`, `$derived`, `$effect` only. No `let count = 0; $: doubled = count * 2;` legacy reactivity in new code.
- **Mutations:** Form Actions in `+page.server.ts`, not API routes. Progressive enhancement is free, and CSRF protection ships out of the box.
- **API routes:** only for non-page JSON consumers (webhooks, mobile clients).
- **Data loading:** `+page.server.ts` when the load touches the DB or secrets; `+page.ts` for universal loads (e.g. public fetch).
- **DB queries:** through Drizzle. Compose with `eq`, `and`, `inArray`. Use `db.execute(sql\`\`)` only for what the query builder can't express.
- **Errors:** throw via `error(404, "Not found")` from `@sveltejs/kit` in load/actions. Custom errors normalize in `hooks.server.ts`'s `handleError`.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/unit/`. E2E under `e2e/`.
- **Run one file:** `pnpm test:unit --run path/to/file.test.ts`. TDD: `pnpm test:unit`.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. **Never mock Drizzle.** Point at a real Postgres via Testcontainers. Mocked-Drizzle tests pass when production SQL is broken.
- **Component tests:** `@testing-library/svelte`. Test what the user sees, not implementation.
- **Playwright:** one `test.describe` per route. Use `page.getByRole` over CSS selectors. Run against the preview build, not dev.

## External APIs

Three patterns for handling auth-bound third-party APIs (Resend, Stripe, GitHub, Slack, and similar):

1. **Vite env vars.** `PUBLIC_*` ships to the browser; everything else stays server-only. Access via `$env/static/private` (build-time) or `$env/dynamic/private` (runtime). SvelteKit refuses to bundle private env into client code.
2. **Doppler, Vault, or Infisical.** Centralized secrets injected at runtime; app code unchanged. Adds an external dependency to local dev.
3. **Authsome.** Declare the provider in code (e.g. `@authsome/resend`); credentials live in `~/.authsome/`. Most concise; auth is hot-swappable without redeploy. See [authsome.dev](https://authsome.dev).

Pick one. The most common breakage is a private key accidentally read via `$env/static/public`.

## Don't

- Don't import `$lib/server/*` from a `.svelte`, `+page.ts`, or `+layout.ts`. The bundler will refuse; if you bypass it, secrets ship.
- Don't use API routes for form posts. Form Actions give you progressive enhancement, CSRF, and typed `ActionData`.
- Don't paginate with `OFFSET` for tables expected to grow past 10k rows. Use keyset (`WHERE id > :last_id ORDER BY id LIMIT 20`).
- Don't run migrations from a hook or top-level module. Run `drizzle-kit migrate` as a separate deploy step.
- Don't put a secret in `PUBLIC_*`. It ships to the browser.
- Don't reach for stores when runes plus `$page.data` cover it. Svelte 5 makes most stores unnecessary.

## Vendor notes

- **Codex / agents.md:** canonical. Stays under the 32 KiB Codex max.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty, or point each rule at this file via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. Nested AGENTS.md per route group is ignored.
- **Aider:** does not auto-discover AGENTS.md yet. `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** does not read AGENTS.md natively. Symlink: `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [SveltyCMS/SveltyCMS](https://github.com/SveltyCMS/SveltyCMS/blob/main/AGENTS.md) · [sveltejs/kit](https://github.com/sveltejs/kit/blob/main/AGENTS.md) · [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm)
