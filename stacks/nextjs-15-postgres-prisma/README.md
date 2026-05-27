---
stack_slug: nextjs-15-postgres-prisma
display_name: Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest 2
components: [nextjs-15, react-19, postgres-16, prisma-5, tailwind-3, vitest-2]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Next.js 15 + Postgres + Prisma + Tailwind + Vitest

The default modern Node/TS web app stack. Server components by default, Prisma for the database boundary, Tailwind for styling, Vitest for unit and component tests.

## Why these choices

- **App Router + server components.** Next 15 is server-first. Pages are static where possible, server components fetch and render, client components stay small.
- **Prisma over raw SQL.** Typed boundary, generated client, migrations as code. The cost is tight coupling to Prisma's query patterns.
- **Tailwind 3.4.** Zero-runtime CSS. Pairs well with server components since the stylesheet ships once.
- **Vitest over Jest.** Native ESM, faster, same API.
- **pnpm over npm/yarn.** Speed and strict dep isolation.

## What to tune

- Drop the `(marketing)` route group if you don't ship a public marketing site.
- If you don't run background jobs, drop the `src/server/tasks/` mention; [Inngest](https://www.inngest.com/) or [Trigger.dev](https://trigger.dev) are common Next-friendly alternatives.
- Swap Prisma's provider to SQLite for local-only dev if Postgres isn't required.

## Verification

Pilot entry. `verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
