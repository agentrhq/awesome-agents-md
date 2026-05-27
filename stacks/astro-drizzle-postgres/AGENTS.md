# AGENTS.md · Astro 6.3 · Drizzle 0.45 · Turso (libSQL) · Vitest 4.1.7

## Stack

- **Runtime:** Node.js 22.x LTS, package manager **pnpm 10** via `corepack enable`.
- **Framework:** Astro 6.3 with the `@astrojs/node` adapter and per-route `prerender`. Static by default, opt-in to SSR per route.
- **Database:** Turso (libSQL, SQLite at the wire) via `@libsql/client`. Accessed through **Drizzle ORM 0.45+** with the `drizzle-orm/libsql` driver.
- **Testing:** Vitest 4.1.7 (unit and component). Astro Container API for component tests.
- **Typescript:** strict mode via Astro's defaults (`tsconfig.json` extends `astro/tsconfigs/strict`).

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 4321; kill stale: `lsof -ti :4321 | xargs -r kill -9`)
- Build: `pnpm build` (Vite production build, adapter output in `dist/`)
- Preview: `pnpm preview` (serves the built app, port 4321)
- Typecheck: `pnpm astro check` (runs `astro sync` then `tsc`; expect <30s, kill at 2m)
- Lint: `pnpm lint` (`eslint .` + `prettier --check .`)
- Tests: `pnpm test` (Vitest watch). One shot: `pnpm test --run`. Single file: `pnpm test --run path/to/file.test.ts`

DB:
- Generate migration: `pnpm drizzle-kit generate` (writes SQL to `drizzle/migrations/`)
- Push (dev only): `pnpm drizzle-kit push` (skips migration files; safe for the embedded SQLite branch)
- Apply (prod): `pnpm drizzle-kit migrate` (uses `TURSO_URL` + `TURSO_AUTH_TOKEN`)
- Studio: `pnpm drizzle-kit studio` (port 4983)
- Local replica (optional): `turso dev --db-file local.db` mirrors a Turso DB to disk for offline work.

Expected runtimes: install ≤90s, dev cold start ≤4s, build ≤45s on a typical site. Anything past 3× is a regression, not flake.

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
│   ├── db.ts                # libSQL client + Drizzle binding. Singleton.
│   └── env.ts               # Typed env from `astro:env/server`.
├── content/                 # Optional: Astro content collections (Markdown/MDX).
└── styles/                  # Global CSS.

drizzle/
├── schema.ts                # Single source of truth. Tables use sqliteTable from drizzle-orm/sqlite-core.
└── migrations/              # Generated SQL. Never hand-edit.

tests/                       # Vitest specs.
```

`src/lib/db.ts` constructs the libSQL client once: `createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN })` then `drizzle(client, { schema })`. Astro's static-by-default model means most pages never touch the DB; SSR routes opt in with `export const prerender = false`. Component frontmatter (between `---` fences) runs on the server during build or SSR; it never ships to the browser.

## Conventions

- **Files:** kebab-case for paths (`user-profile.astro`); component file name matches the route segment.
- **Imports:** `@/` aliases `src/` via `tsconfig.json` paths. Avoid `../../`.
- **Hydration directives:** default to zero JS. Add `client:load` only when interactivity is needed on first paint; prefer `client:idle` or `client:visible` otherwise. `client:only="react"` is last resort.
- **Astro Image:** use `astro:assets` (`import { Image } from 'astro:assets'`) for any image you ship. No raw `<img>` for assets you control.
- **DB queries:** through Drizzle. Compose with `eq`, `and`, `inArray`. libSQL accepts SQLite syntax. Use `db.run(sql\`\`)` only for what the query builder cannot express.
- **Env:** declare schema in `astro.config.mjs` via `defineConfig({ env: { schema: ... } })`, access typed values via `astro:env/server`. Never read `import.meta.env.X` directly outside that boundary.
- **Errors:** API endpoints return `new Response(JSON.stringify({error}), { status })`. Pages throw via `Astro.redirect` or render a fallback component.

## Tests

- **Where:** unit tests next to the file (`foo.ts` + `foo.test.ts`) or under `tests/`.
- **Run one file:** `pnpm test --run path/to/file.test.ts`. TDD: `pnpm test`.
- **Component tests:** Astro Container API (`experimental_AstroContainer.create()`), or render React/Svelte islands directly with their respective testing libraries.
- **DB tests:** point Drizzle at an in-memory libSQL (`createClient({ url: ":memory:" })`). Fast, zero network, identical SQL dialect to Turso.
- **Mock policy:** external HTTP via `msw`, time via `vi.useFakeTimers()`. **Never mock Drizzle.** Use the in-memory libSQL client. Mocked-Drizzle tests pass while production SQL is broken.
- **E2E:** Playwright runs against `pnpm preview` if you need it. Most Astro sites assert HTML snapshots and skip E2E.

## Ops

- **Hosting:** Cloudflare Pages (`@astrojs/cloudflare`) for edge-rendered routes, or Vercel (`@astrojs/vercel`) when you want Node SSR. Both adapters honor per-route `prerender`.
- **Turso replication:** create read replicas in regions near your users via `turso db replicate <db> <region>`. The client picks the nearest replica automatically when you set `syncUrl`. No app code change.
- **Health check:** expose `src/pages/api/health.json.ts` returning `{ ok: true, db: await pingDb() }`. Set platform readiness to hit it.
- **Observability:** `@sentry/astro` instruments page renders, endpoints, and middleware. Pair with `@libsql/client` query logs at debug level only.
- **CI:** GitHub Actions with `actions/setup-node@v4` + pnpm store cache. Workflow: `pnpm install --frozen-lockfile` → `pnpm astro check` → `pnpm test --run` → `pnpm build`.
- **Migrations:** `pnpm drizzle-kit migrate` runs as a deploy hook against `TURSO_URL`. For preview branches, `drizzle-kit push` against a forked Turso DB is acceptable; never push in production.
- **Logging:** structured JSON via `console.log`. Cloudflare Pages and Vercel both parse it.

## External APIs

Use Astro's first-party env module. Declare the schema in `astro.config.mjs`:

```ts
env: {
  schema: {
    TURSO_URL: envField.string({ context: "server", access: "secret" }),
    TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
    RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
  },
},
```

Then read typed values via `import { TURSO_URL } from "astro:env/server"`. `astro:env/server` refuses to import from a hydrated component, which catches leaks at build time. For runtime rotation across regions, wire Doppler, Vault, or Infisical into the deploy pipeline.

*Authsome*: declare providers (`@authsome/resend`, `@authsome/stripe`) and load credentials from `~/.authsome/` instead of env, so rotation does not require a redeploy. See [authsome.dev](https://authsome.dev).

## Don't

- Don't import server-only modules (`src/lib/db.ts`, anything that reads a secret) from a framework island that hydrates. The build will not always catch it; the browser will.
- Don't set `output: 'server'` if 90% of your routes are static. Per-route `prerender` keeps the static win.
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

*Production references:* [withstudiocms/studiocms](https://github.com/withstudiocms/studiocms/blob/main/AGENTS.md) · [XingHe501/gemini-gems](https://github.com/XingHe501/gemini-gems/blob/main/AGENTS.MD) · [nickytonline/nickytdotco](https://github.com/nickytonline/nickytdotco/blob/main/AGENTS.md)
