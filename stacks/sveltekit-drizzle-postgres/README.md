---
stack_slug: sveltekit-drizzle-postgres
display_name: SvelteKit 2 · Svelte 5 · Drizzle 0.30 · Postgres 16 · Playwright · Vitest 2
components: [sveltekit-2, svelte-5, drizzle-0.30, postgres-16, playwright-1.45, vitest-2]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# SvelteKit 2 + Drizzle + Postgres + Playwright + Vitest

A server-first SvelteKit app with a typed Drizzle boundary to Postgres, Form Actions for mutations, and Playwright covering the user-facing flows.

## Why these choices

- **SvelteKit 2 + Svelte 5 runes.** Server-first by default, file-based routing, and runes (`$state`, `$derived`, `$effect`) replace most store boilerplate.
- **Drizzle over Prisma.** Thin SQL-shaped query builder, no separate engine binary, codegen is just types. Pairs cleanly with `postgres-js`.
- **Form Actions over API routes.** Progressive enhancement, CSRF protection, typed `ActionData`. API routes stay for the rare non-page JSON consumer.
- **Playwright over Cypress.** Better SvelteKit SSR coverage, parallel by default, runs against the production preview build.
- **pnpm over npm/yarn.** Speed and strict dep isolation.

## What to tune

- Drop `(app)` route group if the whole app is public.
- Swap `postgres-js` for `pg` if you need a long-lived pool with end-to-end TLS verification quirks.
- If you don't need E2E, remove `e2e/` and the Playwright dep; keep Vitest component tests.

## Verification

Popular repos that ship all four (SvelteKit + Drizzle + Postgres + Playwright) plus an AGENTS.md were hard to find when this was written, so it leans on framework conventions. Send a PR if you run the full combo.

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
