# Awesome AGENTS.md

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> Battle-tested AGENTS.md per stack. Verified against Codex, Cursor, Jules, Aider. One CC0 file you can drop into your repo.

Most teams write their AGENTS.md badly. Generic instructions, no test commands, no architecture map. The agent reads it, ignores it, and silently wastes runs. This is a stack-grouped reference of files that actually shape behavior, one folder per stack.

## Contents

- [Stacks](#stacks)
- [Quick start](#quick-start)
- [Schema](#schema)
- [Contributing](#contributing)
- [License](#license)

## Stacks

v1 launch (May 2026). Twelve stacks live. Each entry: drop-in AGENTS.md, frontmatter README, five verification prompts.

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

A few stacks (Go+chi, SvelteKit+Postgres+Playwright, Astro+Drizzle+Postgres) had no 500+ star AGENTS.md in the wild as of May 2026. Those entries lean on framework-side conventions and reference repos under the star threshold; their `README.md` flags the gap and invites PRs from teams running the stack at scale.

## Quick start

The fastest path is the CLI. From your project root:

```bash
npx agents-md-pick                       # interactive picker
npx agents-md-pick nextjs-postgres-prisma  # by slug (substring match)
```

That copies the matching `AGENTS.md` to your repo root. Then edit the `## Stack` versions to match yours, skim the other H2s, adjust anything you disagree with. For agents that don't auto-discover AGENTS.md:

- **Claude Code:** `ln -s AGENTS.md CLAUDE.md`
- **Aider:** `ln -s AGENTS.md CONVENTIONS.md`, or `aider --read AGENTS.md`

Prefer to copy by hand? Open the stack folder from the table above and grab `AGENTS.md`.

## Tools

Two zero-dependency Node CLIs ship from this repo:

- [`agents-md-pick`](tools/agents-md-pick) · drop a battle-tested AGENTS.md into your repo (above).
- [`agents-md-lint`](tools/agents-md-lint) · validate an AGENTS.md against the schema. Same checks as CI, run locally:

  ```bash
  npx agents-md-lint                 # lint AGENTS.md under cwd
  npx agents-md-lint AGENTS.md       # one file
  npx agents-md-lint stacks/         # every AGENTS.md under a directory
  ```

## Schema

Every entry has exactly these H2 sections, in order:

1. `## Stack` · exact versions
2. `## Run` · install, dev, test, build, typecheck commands
3. `## Architecture` · directory map and what lives where
4. `## Conventions` · naming, file size limits, comment policy
5. `## Tests` · how to run, where to add, what to mock
6. `## External APIs` · auth-bound dependencies, recommended pattern
7. `## Don't` · anti-patterns specific to this stack
8. `## Vendor notes` · per-vendor deltas (Codex, Cursor, Jules, Aider, Claude Code)

CI enforces all eight via [.github/workflows/validate.yml](.github/workflows/validate.yml). Files cap at 200 lines. Bloated AGENTS.md files have been shown to [reduce success rates and increase costs by 20%+](https://reddit.com/r/ClaudeAI/comments/1r7mvja/new_research_agentsmd_files_reduce_coding_agent/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). One PR per stack. The author must run a stock prompt through at least 2 of {Codex, Cursor, Jules, Aider} using their AGENTS.md and attach run logs.

## License

This list, the schema, and every `AGENTS.md` in `stacks/` are released under [CC0 1.0 Universal](LICENSE). Copy freely.

---

Curated by [Authsome](https://authsome.dev) · agent identity for third-party APIs.
