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

Pilot launch (May 2026). Three stacks live, nine queued for v1.

| Stack | Status | Path |
|---|---|---|
| Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest 2 | live | [stacks/nextjs-15-postgres-prisma](stacks/nextjs-15-postgres-prisma) |
| Rails 8 · Sidekiq 7 · Postgres 16 · RSpec 6 | live | [stacks/rails-8-sidekiq-postgres](stacks/rails-8-sidekiq-postgres) |
| FastAPI 0.115 · Celery 5 · Postgres 16 · pytest 8 | live | [stacks/fastapi-celery-postgres](stacks/fastapi-celery-postgres) |
| Django 5 · Celery · Postgres · pytest | queued | |
| NestJS · Prisma · Redis · Jest | queued | |
| Go · chi · Postgres · testify | queued | |
| Bun · Hono · SQLite · bun:test | queued | |
| Rust · Axum · Postgres · sqlx | queued | |
| Elixir · Phoenix · Ecto · ExUnit | queued | |
| SvelteKit · Drizzle · Postgres · Playwright | queued | |
| Astro · Postgres · Drizzle · Vitest | queued | |
| .NET 9 (ASP.NET Core) · EF Core · Postgres · xUnit | queued | |

## Quick start

1. Pick the stack closest to yours from the table above.
2. Copy the `AGENTS.md` from that folder to your repo root.
3. Edit the `## Stack` versions to match yours. Skim the other H2s and adjust any conventions you disagree with.
4. For agents that don't auto-discover AGENTS.md:
   - **Claude Code:** `ln -s AGENTS.md CLAUDE.md`
   - **Aider:** `ln -s AGENTS.md CONVENTIONS.md`, or `aider --read AGENTS.md`

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
