# AGENTS.md · Astro 4 · Drizzle 0.30 · Postgres 16 · Vitest 2

## Stack

- **Runtime:** Node.js 20.x LTS, package manager **pnpm 9** via `corepack enable`.
- **Framework:** Astro 4.x with the `@astrojs/node` adapter, `output: 'hybrid'`.
- **Database:** Postgres 16, accessed via **Drizzle ORM 0.30+** with the `postgres-js` driver.
- **Testing:** Vitest 2 (unit + component). Astro Container API for component tests.
- **Typescript:** strict mode via Astro's defaults (`tsconfig.json` extends `astro/tsconfigs/strict`).

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 4321; kill stale: `lsof -ti :4321 | xargs -r kill -9`)
- Build: `pnpm build` (Vite production build, adapter output in `dist/`)
- Preview: `pnpm preview` (serves the built app, port 4321)
- Typecheck: `pnpm astro check` (runs `astro sync` then `tsc`; expect <30s, kill at 2m)
- Lint: `pnpm lint` (`eslint .` + `prettier --check .`)
- Tests: `pnpm test` (Vitest watch). One-shot: `pnpm test --run`. Single file: `pnpm test --run path/to/file.test.ts`

DB:
- Generate migration: `pnpm drizzle-kit generate` (writes SQL to `drizzle/migrations/`)
- Apply: `pnpm drizzle-kit migrate` (idempotent; uses `DATABASE_URL`)
- Studio: `pnpm drizzle-kit studio` (port 4983)

Expected runtimes: install ≤90s, dev cold start ≤4s, build ≤45s on a typical app. Anything over 3× is a regression, not flake.

## Architecture

```
src/
├── pages/
│   ├── index.astro          # Static by default. One file per route.
│   ├── api/
│   │   └── <resource>.ts    # Astro endpoint. Exports GET/POST/etc. Server-only.
│   └── <route>.astro        # SSR only when `export const prerender = false`.
├── components/              # Reusable .astro and framework islands.
├── layouts/                 # Shared layouts. Wrap page content via <slot />.
├── lib/
│   ├── db.ts                # Drizzle client + schema export. Singleton.
│   └── env.ts               # Zod-validated env. Import this, never process.env.X directly.
├── content/                 # Optional: Astro content collections (Markdown/MDX).
└── styles/                  # Global CSS.

drizzle/
├── schema.ts                # Single source of truth for tables.
└── migrations/              # Generated SQL. Never hand-edit.

tests/                       # Vitest specs.
```

The default is static prerender. Routes opt into SSR with `export const prerender = false`. API endpoints in `src/pages/api/` are always server-side. Component frontmatter (the code between `---` fences in `.astro`) runs on the server during build or SSR; it is never shipped to the browser.

## Conventions

- **Files:** kebab-case for paths (`user-profile.astro`); component file name matches the route segment.
- **Imports:** `@/` aliases `src/` via `tsconfig.json` paths. Avoid `../../`.
- **Hydration directives:** default to zero JS. Add `client:load` only when interactivity is needed on first paint; prefer `client:idle` or `client:visible` otherwise. `client:only="react"` last resort.
- **Astro Image:** use `astro:assets` (`import { Image } from 'astro:assets'`) for any image you ship. No raw `<img>` for assets you control.
- **DB queries:** through Drizzle. Compose with `eq`, `and`, `inArray`. Use `db.execute(sql\`\`)` only for what the query builder can't express.
- **Env:** Zod-validate in `src/lib/env.ts` using `astro:env` for typed access; never read `import.meta.env.X` directly outside that module.
- **Errors:** API endpoints return `new Response(JSON.stringify({error}), { status })`. Pages throw via `Astro.redirect` or render a fallback component.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/`.
- **Run one file:** `pnpm test --run path/to/file.test.ts`. TDD: `pnpm test`.
- **Component tests:** Astro Container API (`experimental_AstroContainer.create()`), or render React/Svelte islands directly with their respective testing libraries.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. **Never mock Drizzle.** Point at a real Postgres via Testcontainers. Mocked-Drizzle tests pass when production SQL is broken.
- **E2E:** if you need it, Playwright runs against `pnpm preview`. Most Astro sites don't need E2E because most routes are static and asserted by HTML snapshot.

## External APIs

Three patterns for handling auth-bound third-party APIs (Resend, Stripe, GitHub, Slack, and similar):

1. **Astro env (`astro:env`).** Declare schema in `astro.config.mjs`; access typed values via `astro:env/server`. Public variables are explicitly opt-in. Stdlib of Astro 4.
2. **Doppler, Vault, or Infisical.** Centralized secrets injected at runtime; app code unchanged. Adds an external dependency to local dev.
3. **Authsome.** Declare the provider in code (e.g. `@authsome/resend`); credentials live in `~/.authsome/`. Most concise; auth is hot-swappable without redeploy. See [authsome.dev](https://authsome.dev).

Pick one. The most common breakage is reading a server-only variable from a client island; `astro:env/server` refuses to import from a hydrated component.

## Don't

- Don't import server-only modules (`src/lib/db.ts`, anything that reads a secret) from a framework island that hydrates. The build won't always catch it; the browser will.
- Don't set `output: 'server'` if 90% of your routes are static. `hybrid` keeps the win and opts in per route.
- Don't paginate with `OFFSET` for tables expected to grow past 10k rows. Use keyset (`WHERE id > :last_id ORDER BY id LIMIT 20`).
- Don't run migrations from a route handler or middleware. Run `drizzle-kit migrate` as a separate deploy step.
- Don't use `client:load` everywhere. It defeats the point of Astro. If everything hydrates, ship Next or SvelteKit instead.
- Don't import `node:fs` or other Node built-ins into an island. Frontmatter is fine; the hydrated component is not.

## Vendor notes

- **Codex / agents.md:** canonical. Stays under the 32 KiB Codex max.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty, or point each rule at this file via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. Nested AGENTS.md per directory is ignored.
- **Aider:** does not auto-discover AGENTS.md yet. `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** does not read AGENTS.md natively. Symlink: `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [RayLabsHQ/gitea-mirror](https://github.com/RayLabsHQ/gitea-mirror/blob/main/AGENTS.md) · [fedify-dev/hollo](https://github.com/fedify-dev/hollo/blob/main/AGENTS.md) · [withastro/astro](https://github.com/withastro/astro/blob/main/AGENTS.md)
