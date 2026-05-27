---
stack_slug: nextjs-15-postgres-prisma
display_name: Next.js 16.2 · React 19 · Postgres 16 · Prisma 7.8 · Tailwind 3 · Vitest 3
components: [nextjs-16.2, react-19, postgres-16, prisma-7.8, tailwind-3, vitest-3, node-24]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Next.js 16.2 + React 19 + Postgres + Prisma + Tailwind + Vitest

The default modern Node/TS web app stack. Server components by default, Prisma for the database boundary, Tailwind for styling, Vitest for unit and component tests. Turbopack is the dev and build default. PPR splits each route into a static shell plus dynamic islands.

## Why these choices

- **App Router + React 19 server components.** Pages are static where possible; server components fetch and render; client components stay small. Server actions ("use server") replace most ad-hoc `/api/*` handlers.
- **PPR and Turbopack as Next.js 16 defaults.** Partial Prerendering ships a static shell with Suspense holes for dynamic data. Turbopack is the dev and `next build` default in 16.x.
- **Prisma 7.8 over raw SQL.** Typed boundary, generated client, migrations as code. The cost is tight coupling to Prisma's query patterns.
- **Tailwind 3.4.** Zero-runtime CSS. Pairs well with server components since the stylesheet ships once.
- **Vitest 3 over Jest.** Native ESM, faster, same API.
- **pnpm 11 over npm/yarn.** Speed and strict dep isolation. Node 24 LTS.

## What to tune

- Drop the `(marketing)` route group if you don't ship a public marketing site.
- If you don't run background jobs, drop the `src/server/tasks/` mention; [Inngest](https://www.inngest.com/) or [Trigger.dev](https://trigger.dev) are common Next-friendly alternatives.
- Swap Prisma's provider to SQLite for local-only dev if Postgres isn't required.
- If you self-host instead of using Vercel, swap the Ops deploy line for Docker + your reverse proxy.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
