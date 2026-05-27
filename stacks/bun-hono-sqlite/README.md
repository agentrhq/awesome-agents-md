---
stack_slug: bun-hono-sqlite
display_name: Bun 1.3.14 · Hono 4.12.23 · SQLite · Drizzle 0.45 · bun:test
components: [bun-1.3.14, hono-4.12.23, sqlite, drizzle-0.45, bun-test]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Bun + Hono + SQLite + Drizzle + bun:test

Single-runtime, zero-config TypeScript backend. Bun runs and tests the code, Hono routes it, SQLite stores it, Drizzle types the queries.

## Why these choices

- **Bun over Node.** One binary for runtime, package manager, test runner, and bundler. `bun install` is roughly an order of magnitude faster than `npm`, and `bun test` runs without a separate Jest install.
- **Hono over Express/Fastify.** Tiny core, edge-portable, ergonomic chaining API, built-in test client via `app.request()`.
- **`bun:sqlite` + Drizzle.** Synchronous SQLite calls (in-process, sub-millisecond) with a typed ORM layer. No connection pool to manage.
- **Drizzle over Prisma.** SQL-shaped queries, no separate generation step, schema lives in TS.
- **`bun:test` over Vitest.** Built in. Jest-compatible API. `setSystemTime` for time control without external libs.

## What to tune

- Swap SQLite for Turso (libSQL) if you need replication. Drizzle has a `drizzle-orm/libsql` driver with the same API surface.
- Drop `drizzle-kit studio` and use the `sqlite3` CLI if you don't want the extra dev dep.
- If you deploy to Cloudflare Workers or Deno Deploy, swap `Bun.serve` for the platform's entry and keep the rest.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
