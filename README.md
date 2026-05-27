# Awesome AGENTS.md

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> A curated set of AGENTS.md files, one per stack. Pick yours, copy it in. CC0.

A useful AGENTS.md is concrete: the exact run commands, a directory map, the anti-patterns specific to your stack. Most of the ones you find online aren't. This repo collects working examples grouped by stack instead of by author or tool.

## Contents

- [Stacks](#stacks)
- [Quick start](#quick-start)
- [Schema](#schema)
- [Contributing](#contributing)
- [License](#license)

## Stacks

Fifteen stacks. Each folder ships the AGENTS.md plus a short README and five prompts you can use to check it works in your agent.

| Stack | Path |
| --- | --- |
| Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest 2 | [stacks/nextjs-15-postgres-prisma](stacks/nextjs-15-postgres-prisma) |
| Rails 8 · Sidekiq 7 · Postgres 16 · RSpec 6 | [stacks/rails-8-sidekiq-postgres](stacks/rails-8-sidekiq-postgres) |
| FastAPI 0.115 · Celery 5 · Postgres 16 · pytest 8 | [stacks/fastapi-celery-postgres](stacks/fastapi-celery-postgres) |
| Django 5.1 · DRF 3.15 · Celery 5.4 · Postgres 16 · pytest 8 | [stacks/django-5-celery-postgres](stacks/django-5-celery-postgres) |
| NestJS 10 · Prisma 5 · BullMQ · Redis 7 · Jest 29 | [stacks/nestjs-10-prisma-redis](stacks/nestjs-10-prisma-redis) |
| Go 1.23 · chi v5 · pgx v5 · sqlc · testify | [stacks/go-chi-postgres](stacks/go-chi-postgres) |
| Bun 1.1 · Hono 4 · SQLite · Drizzle 0.30 · bun:test | [stacks/bun-hono-sqlite](stacks/bun-hono-sqlite) |
| Rust 1.80 · Axum 0.7 · sqlx 0.8 · Postgres 16 · tokio 1 | [stacks/rust-axum-postgres](stacks/rust-axum-postgres) |
| Elixir 1.17 · Phoenix 1.7 · Ecto 3 · Postgres 16 · Oban · ExUnit | [stacks/phoenix-ecto-postgres](stacks/phoenix-ecto-postgres) |
| SvelteKit 2 · Svelte 5 · Drizzle 0.30 · Postgres 16 · Playwright · Vitest 2 | [stacks/sveltekit-drizzle-postgres](stacks/sveltekit-drizzle-postgres) |
| Astro 4 · Drizzle 0.30 · Postgres 16 · Vitest 2 | [stacks/astro-drizzle-postgres](stacks/astro-drizzle-postgres) |
| .NET 9 · ASP.NET Core 9 · EF Core 9 · Postgres 16 · xUnit · Testcontainers | [stacks/dotnet-9-aspnetcore-efcore](stacks/dotnet-9-aspnetcore-efcore) |
| Laravel 11 · Horizon · Postgres 16 · Pest 3 | [stacks/laravel-11-horizon-postgres](stacks/laravel-11-horizon-postgres) |
| SwiftUI · SwiftData · XCTest (Swift 5.10+ / 6) | [stacks/swiftui-swiftdata-xctest](stacks/swiftui-swiftdata-xctest) |
| Flutter 3.24+ · Riverpod 2 · Drift · go_router | [stacks/flutter-riverpod-drift](stacks/flutter-riverpod-drift) |

Five stacks (Go+chi, SvelteKit+Postgres+Playwright, Astro+Drizzle+Postgres, Laravel, Flutter) had no popular AGENTS.md to copy from when this gallery was written. Those entries lean on framework-level conventions instead. Their per-stack README says so up front.

## Quick start

From your project root:

```bash
npx agents-md-pick                          # interactive picker
npx agents-md-pick nextjs-postgres-prisma   # by slug (substring match)
```

That copies the matching `AGENTS.md` to your repo root. Edit the `## Stack` versions to match yours, skim the other H2s, change anything you don't agree with. For agents that don't auto-discover AGENTS.md:

- **Claude Code:** `ln -s AGENTS.md CLAUDE.md`
- **Aider:** `ln -s AGENTS.md CONVENTIONS.md`, or `aider --read AGENTS.md`

Prefer to copy by hand? Open the stack folder from the table above and grab `AGENTS.md`.

## Tools

Two zero-dependency Node CLIs live in this repo:

- [`agents-md-pick`](tools/agents-md-pick): copies a stack's AGENTS.md into your project (above).
- [`agents-md-lint`](tools/agents-md-lint): runs the same schema checks as CI, locally:

  ```bash
  npx agents-md-lint                 # lint AGENTS.md under cwd
  npx agents-md-lint AGENTS.md       # one file
  npx agents-md-lint stacks/         # every AGENTS.md under a directory
  ```

## Schema

Every entry has these H2 sections, in order:

1. `## Stack` (exact versions)
2. `## Run` (install, dev, test, build, typecheck)
3. `## Architecture` (directory map and what lives where)
4. `## Conventions` (naming, file size limits, comment policy)
5. `## Tests` (how to run, where to add, what to mock)
6. `## External APIs` (auth-bound dependencies and the recommended pattern)
7. `## Don't` (anti-patterns specific to the stack)
8. `## Vendor notes` (per-vendor deltas: Codex, Cursor, Jules, Aider, Claude Code)

CI enforces all eight via [.github/workflows/validate.yml](.github/workflows/validate.yml). Files cap at 200 lines. Long AGENTS.md files [measurably hurt agent performance](https://reddit.com/r/ClaudeAI/comments/1r7mvja/new_research_agentsmd_files_reduce_coding_agent/), around 20% on the cited research.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). One PR per stack. The author runs a stock prompt through at least two of {Codex, Cursor, Jules, Aider} using their AGENTS.md and attaches run logs.

## License

This list, the schema, and every `AGENTS.md` under `stacks/` are released under [CC0 1.0 Universal](LICENSE). Copy freely.

---

Curated by [Authsome](https://authsome.dev) · agent identity for third-party APIs.
