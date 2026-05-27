---
stack_slug: phoenix-ecto-postgres
display_name: Elixir 1.19 · Phoenix 1.8.6 · Ecto 3 · Postgres 16 · Oban · ExUnit
components: [elixir-1.19, otp-28, phoenix-1.8.6, ecto-3, postgres-16, oban, exunit]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Phoenix + Ecto + Postgres + Oban + ExUnit

The default modern Elixir web stack. Phoenix routes and renders, Ecto talks to Postgres, Oban runs background jobs in the same database, ExUnit covers it all with concurrent transactional tests.

## Why these choices

- **Phoenix 1.8.6.** LiveView for interactive UI, verified routes, function components. The default generator output is good enough for production.
- **Ecto over a query builder.** Changesets unify validation and persistence. Migrations as code. The Repo pattern keeps DB access auditable.
- **Oban over Sidekiq.** Postgres-backed, no extra Redis to operate, transactions across job enqueue and business writes.
- **Contexts as the seam.** Bounded contexts let LiveView and controllers talk to one public API per domain. Stops the schema from leaking into the web layer.
- **ExUnit sandbox.** Concurrent tests against a real Postgres, each in its own transaction. Faster and more honest than mocking Ecto.

## What to tune

- Swap LiveView for plain controllers + JSON if you're shipping a pure API. Keep the contexts unchanged.
- Drop Oban if you have no background work. Add it back when you do, not before.
- For umbrella apps, this layout applies inside each child app under `apps/<name>/lib/`. The `_web` split still holds.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
