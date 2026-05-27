# Awesome AGENTS.md

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> A curated set of AGENTS.md files, one per stack. Pick yours, copy it in. CC0.

A useful AGENTS.md is concrete: the exact run commands, a directory map, the anti-patterns specific to your stack. Most of the ones you find online aren't. This repo collects working examples grouped by stack instead of by author or tool.

## Contents

- [What is AGENTS.md?](#what-is-agentsmd)
- [How this repo helps](#how-this-repo-helps)
- [Stacks](#stacks)
- [How to use this](#how-to-use-this)
- [Tools](#tools)
- [Schema](#schema)
- [Best practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

## What is AGENTS.md?

AGENTS.md is a Markdown file at the root of your repo. Coding agents read it before they edit anything and treat it as house rules.

OpenAI Codex started the convention. Cursor, Google Jules, and Aider all read it. Claude Code reads it via a symlink (`ln -s AGENTS.md CLAUDE.md`).

Without one, the agent guesses your conventions and gets a lot wrong: wrong test command, wrong file paths, mocked DB instead of real, `OFFSET` pagination on a large table. With a good one, it stops guessing.

A short example (Next.js):

```markdown
# AGENTS.md

## Stack
- Node.js 20 LTS, pnpm 9
- Next.js 15 (App Router, React 19)
- Postgres 16 + Prisma 5
- Tests: Vitest 2

## Run
- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm dev` (port 3000)
- Test one file: `pnpm test --run path/to/file.test.ts`

## Don't
- Don't call `prisma` from a client component. Use a server action or `src/server/`.
- Don't put secrets in `NEXT_PUBLIC_*` (those ship to the browser).
- Don't paginate with `OFFSET` past page 50.
```

That's a slice of [stacks/nextjs-15-postgres-prisma/AGENTS.md](stacks/nextjs-15-postgres-prisma/AGENTS.md). The full file has eight H2 sections; the ones above are three of them.

## How this repo helps

This isn't documentation about AGENTS.md. It's the actual files, ready to copy.

For each of fifteen real-world stack combinations, you get:

- A complete `AGENTS.md` (around 100 lines) tuned to that stack.
- A short `README.md` explaining the stack choices and what to tune.
- Five prompts you can run through your agent to confirm the file works.
- A CC0 license, so you can copy without attribution.

Two CLIs ship alongside:

- `agents-md-pick`: `npx agents-md-pick nextjs-prisma` copies the right file into your project root.
- `agents-md-lint`: validates your own AGENTS.md against the same schema this gallery uses.

The workflow: pick the stack closest to yours, run the CLI, edit a few lines (versions, paths) to match your repo. You have a working AGENTS.md without writing one from scratch.

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

## How to use this

You have a project (say, a Next.js app with Postgres and Prisma). Your team uses Cursor or Claude Code or Codex. You want the agent to follow your conventions instead of guessing. The five-minute path:

**1. Find your stack in the table above.**

Look for the row closest to your project. You don't need an exact match. If you run Next.js with Prisma, the "Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest 2" row is the one to grab. Use the closest fit and tweak it next.

**2. Get the AGENTS.md into your repo.**

From your project root:

```bash
npx agents-md-pick                          # interactive picker
npx agents-md-pick nextjs-postgres-prisma   # by slug, substring match works
```

That writes `AGENTS.md` to your current directory. Prefer doing it by hand? Open the folder linked in the table and copy `AGENTS.md` yourself.

**3. Tweak the file for your project.**

Open `AGENTS.md` and:

- Update the versions in `## Stack` to match what you actually run (e.g. `pnpm 10` instead of `pnpm 9`).
- Adjust paths in `## Architecture` if your folder layout differs.
- Skim `## Don't` and remove rules that don't apply to your codebase.
- Add anything stack-specific that we missed.

This usually takes about five minutes. You don't need to keep anything you disagree with.

**4. Make your agent read the file.**

Codex, Cursor, Jules, and Aider auto-discover `AGENTS.md` at the repo root, so most setups don't need extra steps. Two exceptions:

- **Claude Code:** `ln -s AGENTS.md CLAUDE.md` (symlink so Claude reads it too).
- **Aider:** run with `aider --read AGENTS.md`, or symlink: `ln -s AGENTS.md CONVENTIONS.md`.

**5. Sanity-check it.**

Each stack folder has an `example-prompts.md` with five prompts (paginated endpoint, background job, migration with backfill, refactor, external API call). Pick one, run it through your agent. If the agent uses the right test runner, hits the right paths, and avoids the anti-patterns you listed, the file is doing its job. If not, the AGENTS.md needs more detail or your agent needs a nudge.

That's the whole flow. The file lives in your repo from then on; every agent run reads it before editing.

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

## Best practices

What makes an AGENTS.md actually shape agent behavior, not just decorate the repo:

1. **Be concrete.** `pnpm test --run path/to/file.test.ts` beats "follow testing conventions". Exact commands, exact paths.
2. **Include a directory map.** Agents perform measurably better when they don't have to crawl the folder structure to figure out where things go.
3. **Anti-patterns earn their keep.** A `## Don't` section catches the mistakes that linters can't. "Don't dispatch jobs in `after_commit`", "don't blur the server/client boundary", and similar.
4. **Stack-specific, not generic.** Pin exact versions: "Tailwind 3.4" tells the agent more than "Tailwind". "Vitest 2" tells it more than "a test runner".
5. **Keep it short.** Cap at 200 lines. Bloated files hurt performance by around 20% on [cited research](https://reddit.com/r/ClaudeAI/comments/1r7mvja/new_research_agentsmd_files_reduce_coding_agent/).
6. **Per-vendor notes at the bottom.** Each agent has quirks (Claude Code needs the symlink; Aider needs `--read AGENTS.md`).
7. **Update when you upgrade.** The `last_verified` date in this gallery's per-stack README is for tracking when the file was last checked.

Every entry here follows all seven. If you write your own from scratch, lift the structure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). One PR per stack. The author runs a stock prompt through at least two of {Codex, Cursor, Jules, Aider} using their AGENTS.md and attaches run logs.

## License

This list, the schema, and every `AGENTS.md` under `stacks/` are released under [CC0 1.0 Universal](LICENSE). Copy freely.

---

Curated by [Authsome](https://authsome.dev) · agent identity for third-party APIs.
