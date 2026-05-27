---
stack_slug: sveltekit-drizzle-postgres
display_name: SvelteKit 2 · Svelte 5 · Drizzle 0.36 · Postgres 16 · Playwright · Vitest 2
components: [sveltekit-2, svelte-5, drizzle-0.36, postgres-16, playwright-1.50, vitest-2]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# SvelteKit 2 + Drizzle + Postgres + Playwright + Vitest

A server-first SvelteKit app with a typed Drizzle boundary to Postgres, Form Actions for mutations, and Playwright covering the user-facing flows.

## Why these choices

- **SvelteKit 2 + Svelte 5 runes.** Server-first by default, file-based routing, runes (`$state`, `$derived`, `$effect`) replace most store boilerplate. Runes are stable in Svelte 5.
- **Drizzle 0.36 over Prisma.** Thin SQL-shaped query builder, no separate engine binary, codegen is just types. Pairs cleanly with `postgres-js`.
- **Form Actions over API routes.** Progressive enhancement, CSRF protection, typed `ActionData`. API routes stay for the rare non-page JSON consumer.
- **Playwright over Cypress.** Better SvelteKit SSR coverage, parallel by default, runs against the production preview build.
- **pnpm 10 over npm/yarn.** Speed and strict dep isolation.

## What to tune

- Drop `(app)` route group if the whole app is public.
- Swap `postgres-js` for `pg` if you need a long-lived pool with end-to-end TLS verification quirks.
- If you don't need E2E, remove `e2e/` and the Playwright dep; keep Vitest component tests.

## Verification

Verified against the structure of `kunkunsh/kunkun` (SvelteKit + Tauri + Drizzle) and `javedh-dev/tracktor` (SvelteKit + Svelte 5 + Drizzle), both of which ship a real root AGENTS.md.

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
