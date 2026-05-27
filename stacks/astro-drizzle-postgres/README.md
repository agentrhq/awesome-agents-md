---
stack_slug: astro-drizzle-postgres
display_name: Astro 4 · Drizzle 0.30 · Postgres 16 · Vitest 2
components: [astro-4, drizzle-0.30, postgres-16, vitest-2]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Astro 4 + Drizzle + Postgres + Vitest

A content-heavy Astro site with selective SSR and a typed Drizzle boundary to Postgres. Static by default, hydrated only where the user actually needs it.

## Why these choices

- **Astro 4 hybrid output.** Static prerender for most pages, opt-in SSR per route. The minimum-JS default is the whole point.
- **Drizzle over Prisma.** Thin SQL-shaped query builder, no separate engine binary, codegen is just types. Plays well with edge-leaning Astro adapters.
- **`@astrojs/node` adapter.** Boring, reliable, no vendor lock-in. Swap for Cloudflare or Vercel if you outgrow it.
- **Vitest over Jest.** Native ESM, faster, Astro's documented testing stack.
- **pnpm over npm/yarn.** Speed and strict dep isolation.

## What to tune

- Drop `src/content/` if you're not using content collections. It's optional in Astro 4.
- Swap `postgres-js` for `pg` if you need a long-lived pool with end-to-end TLS verification quirks.
- If every route is static, you can remove the Node adapter entirely and ship to a static host.

## Verification

Astro + Drizzle + Postgres at scale is uncommon; most production Astro sites use SQLite + Turso, or skip the DB layer entirely. If you run this combination in production, a PR refining the conventions is welcome. `verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
