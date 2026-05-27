---
stack_slug: astro-drizzle-postgres
display_name: Astro 6.3 · Drizzle 0.45 · Turso (libSQL) · Vitest 4.1.7
components: [astro-6.3, drizzle-0.45, turso-libsql, vitest-4.1.7]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Astro 6.3 + Drizzle + Turso + Vitest

A content-heavy Astro site with selective SSR and a typed Drizzle boundary to Turso (libSQL). Static by default, hydrated only where the user actually needs it, replicated to the edge for read-mostly traffic. (The directory keeps its original `astro-drizzle-postgres` slug for stable URLs; the stack itself now targets Turso.)

## Why these choices

- **Astro 6.3 with per-route prerender.** Static prerender for most pages, opt-in SSR per route. The minimum-JS default is the whole point.
- **Turso (libSQL) over Postgres.** Astro deployments tend to live on edge runtimes (Cloudflare, Vercel Edge) where a TCP Postgres pool is painful. Turso speaks SQLite over HTTPS and replicates near your users.
- **Drizzle 0.45 over Prisma.** Thin SQL-shaped query builder, no separate engine binary, codegen is just types. The libSQL driver is first-party in Drizzle.
- **Vitest over Jest.** Native ESM, faster, Astro's documented testing stack.
- **pnpm 10 over npm/yarn.** Speed and strict dep isolation.

## What to tune

- Drop `src/content/` if you're not using content collections.
- Swap Cloudflare for Vercel (or vice versa) by switching adapters; the Drizzle + libSQL layer is portable.
- If every route is static and the DB is read-only at build time, you can skip the adapter entirely and ship to a static host.
- For long-form analytical queries the Postgres branch still makes sense; swap `@libsql/client` for `postgres-js` and update `drizzle-orm/libsql` → `drizzle-orm/postgres-js`.

## Verification

Verified against the structure of `withstudiocms/studiocms` (Astro + libSQL/Turso) and `XingHe501/gemini-gems` (Astro + Drizzle + Turso), both of which ship a real AGENTS.md.

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
