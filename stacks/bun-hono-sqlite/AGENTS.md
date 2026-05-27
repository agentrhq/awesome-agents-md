# AGENTS.md · Bun 1.3.14 · Hono 4.12.23 · SQLite (bun:sqlite) · Drizzle 0.45 · bun:test

## Stack

- **Runtime:** Bun 1.3.14. No Node, no `node_modules` resolver fallbacks. `bun --version` is the floor.
- **Framework:** Hono 4.12.23 (single-file routers, edge-compatible). `Bun.serve` mounts the app.
- **Database:** SQLite via **`bun:sqlite`** (built into Bun, synchronous, WAL by default).
- **ORM:** **Drizzle 0.45+** with the `drizzle-orm/bun-sqlite` driver. Typed queries, schema in TS.
- **Migrations:** `drizzle-kit` generate plus `drizzle-kit migrate`. Snapshots committed.
- **Testing:** `bun:test` (built-in, Jest-compatible). No Jest, no Vitest.
- **TypeScript:** strict via `tsconfig.json`. `"types": ["bun-types"]` only. No `@types/node`.

## Run

- Install: `bun install --frozen-lockfile` (uses `bun.lock`, text format on 1.3+)
- Dev: `bun --hot src/index.ts` (hot reload on save, port 3000 by default)
- Prod: `bun src/index.ts`
- Test (all): `bun test`
- Test (one file): `bun test tests/users.test.ts`
- Test (watch): `bun test --watch`
- Typecheck: `bun run typecheck` (alias for `tsc --noEmit`)
- Lint/format: `bun run lint` (Biome or ESLint, project's choice; pick one)

DB:
- Generate migration: `bun run drizzle-kit generate` (diffs `src/db/schema.ts` against the last snapshot)
- Apply migrations: `bun run drizzle-kit migrate` (or a one-shot `src/db/migrate.ts` that imports the drizzle migrator)
- Inspect: `bun run drizzle-kit studio` (port 4983)

Expected runtimes: `bun install` ≤5s warm, cold start ≤200ms, full `bun test` ≤10s on a typical app. SQLite query p99 should be <1ms in-process.

## Architecture

```
src/
├── index.ts             # Hono app composition + Bun.serve(). One file, terse.
├── env.ts               # Zod schema, parsed once at boot. Exports typed `env`.
├── routes/              # One Router per resource.
│   ├── users.ts         # export const users = new Hono().get(...).post(...)
│   └── posts.ts
├── middleware/          # auth.ts, logger.ts, error.ts. Hono middleware signature.
├── db/
│   ├── schema.ts        # Drizzle schema. Single source of truth.
│   ├── client.ts        # new Database(...) + drizzle(db). Exported singleton.
│   └── migrate.ts       # Optional: run migrations on boot in dev.
├── lib/                 # Pure helpers. No Hono, no DB imports.
└── types.ts             # Shared types. Inferred from Drizzle where possible.

tests/
├── setup.ts             # beforeAll: open in-memory DB, run migrations.
├── users.test.ts        # Mirror routes/users.ts.
└── helpers.ts           # appRequest(app, "GET", "/users") wrapper around app.request().

drizzle/
└── meta/                # Generated migration snapshots. Commit them.
```

Hono is composed, not configured. `src/index.ts` chains `.route("/users", users)` for each resource. Keep that file short.

## Conventions

- **Files:** kebab-case (`user-profile.ts`); camelCase for exports.
- **Imports:** absolute via `@/` aliasing `src/`. Configured in `tsconfig.json` paths.
- **Bun-native APIs only.** `Bun.file()`, `Bun.write()`, `Bun.password.hash()`, `Bun.env`. Don't reach for `fs/promises`, `bcrypt`, or `dotenv` when Bun ships the equivalent.
- **Hono handlers:** validate inputs with `@hono/zod-validator`. Never read `c.req.json()` without a schema.
- **Drizzle queries:** prepared statements via `.prepare()` for hot paths. Avoid raw SQL; if needed, use `sql\`...\`` template, never string concat.
- **Errors:** throw `HTTPException` from Hono for HTTP-shaped errors. Wrap domain errors in `app.onError`.
- **Length cap:** route files >200 lines split by sub-resource. Single-file routers are the point of Hono.

## Tests

- **Where:** mirror `src/routes/foo.ts` with `tests/foo.test.ts`.
- **DB:** `new Database(":memory:")` in `beforeAll`, run migrations against it, reuse the connection. Each test wraps in a transaction that rolls back via `db.transaction(...)` and a thrown sentinel.
- **HTTP:** use `app.request(path, init)` (Hono's built-in test helper). No live server, no `fetch`.
- **Time:** `setSystemTime(new Date("2026-05-27"))` from `bun:test`. Reset in `afterEach`. Do not pull in `sinon` or `@sinonjs/fake-timers`.
- **External HTTP:** mock at the boundary. Bun's `fetch` is spy-able; for richer matchers use `msw` (works in Bun).
- **Redirects:** wrap `app.request` to follow redirects in tests (`appRequestWithRedirect`). The default does not follow.

## Ops

- **Deploy targets:** Cloudflare Workers + D1 for edge, or Fly.io/Railway with a mounted volume for self-hosted SQLite.
- **Production SQLite:** WAL is on by default (`bun:sqlite` sets `journal_mode=WAL`). SQLite is single-writer. Concurrent readers are fine, concurrent writers serialize at the file lock. If you need write throughput beyond ~1k/s sustained, switch to Postgres.
- **Backups:** run `Litestream` as a sidecar process replicating the SQLite file to S3-compatible storage. Set `litestream replicate` in a sidecar container; restore on boot with `litestream restore` before `bun src/index.ts`.
- **Volume:** the SQLite file lives on a mounted volume (`/data/app.db`). Never under `/tmp` or the container layer.
- **Logging:** Bun has a built-in console + structured `console.log({...})` is fine; pipe stdout to your platform's log collector.
- **Health:** add a `GET /health` route that runs `db.query("SELECT 1").get()` to confirm the file is reachable.
- **CI:** GitHub Actions with `oven-sh/setup-bun@v2`, `bun install --frozen-lockfile`, `bun test`, `bun run typecheck`.

## External APIs

- **Native pattern:** `src/env.ts` defines a Zod schema for every variable the app reads. Parse `Bun.env` once at import time. On parse failure, the process exits before `Bun.serve` binds. Routes import the typed `env` object, not `Bun.env` directly.
- For teams with rotation policies, layer a secret manager (Doppler, Vault, Infisical) underneath. It injects env vars and the Zod schema still validates them, no app changes.
- Mixing two sources means two source-of-truth files for the same secret. Pick one resolver.
- Authsome is an alternative when credentials need to rotate without redeploys. See [authsome.dev](https://authsome.dev).

## Don't

- Don't import `node:fs`, `node:path`, or other `node:*` modules when a `Bun.*` API exists. It works but leaks Node assumptions.
- Don't mix `bun:sqlite` and a remote Postgres in the same repo without an adapter layer. The sync/async mismatch will bite.
- Don't use `better-sqlite3` alongside `bun:sqlite`. Pick one; `bun:sqlite` is the default for a reason.
- Don't run `drizzle-kit push` against production. Generate migrations and apply them; `push` is dev-only.
- Don't put SQLite files under `/tmp` in production. They get wiped. Use a mounted volume.
- Don't rely on `process.env` in tests. Set via `Bun.env` or a test-only `.env.test` loaded explicitly.
- Don't use `setTimeout` for retries inside a request handler. The connection dies first.

## Vendor notes

- **Codex / agents.md:** canonical. Comfortably under the 32 KiB cap.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty or point at this via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. No nested support.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [FreiFahren/FreiFahren](https://github.com/FreiFahren/FreiFahren/blob/main/AGENTS.md) · [openRin/Rin](https://github.com/openRin/Rin/blob/main/AGENTS.md) · [open-pencil/open-pencil](https://github.com/open-pencil/open-pencil/blob/master/AGENTS.md)
