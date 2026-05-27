# Contributing

One PR per stack. The PR title must be `Add <Display Name>`, e.g. `Add Bun · Hono · SQLite · bun:test`.

## What a stack entry contains

```
stacks/<stack-slug>/
├── AGENTS.md           # the file users copy into their repo
├── README.md           # frontmatter and "why this stack"
├── example-prompts.md  # 5 verification prompts
└── changelog.md        # only when the file is updated
```

## Frontmatter (in stacks/<slug>/README.md)

```yaml
---
stack_slug: nextjs-15-postgres-prisma
display_name: Next.js 15 · Postgres 16 · Prisma 5 · Tailwind 3 · Vitest 2
components: [nextjs-15, postgres-16, prisma-5, tailwind-3, vitest-2]
verified_with: [codex, cursor]
last_verified: 2026-05-27
maintainer: <your-github-handle>
license: CC0-1.0
---
```

`verified_with` accepts: `codex`, `cursor`, `jules`, `aider`. At least 2 are required to merge.

## Schema (required H2 sections in AGENTS.md, in this order)

1. `## Stack`
2. `## Run`
3. `## Architecture`
4. `## Conventions`
5. `## Tests`
6. `## Ops`
7. `## External APIs`
8. `## Don't`
9. `## Vendor notes`

CI enforces all nine. Files cap at 200 lines. Longer files [hurt agent performance](https://reddit.com/r/ClaudeAI/comments/1r7mvja/new_research_agentsmd_files_reduce_coding_agent/), so keep it short.

## Verification

Before opening the PR:

1. Drop your AGENTS.md into a real repo of the target stack.
2. Run this stock prompt through at least 2 of {Codex, Cursor, Jules, Aider}:

   > Add a paginated `GET /users` endpoint that returns users with cursor pagination (20 per page). Include a test.

3. At least 2 of the 4 agents must produce compilable, convention-following code on the first try.
4. Save the run logs (terminal output or screenshots) and attach them to the PR.

If one of the four agents won't cooperate, ship the entry with the agents that did work in `verified_with` and open an issue tagged `needs-<vendor>-verification`. We'd rather have an honest entry than a missing one.

## Style

- No em-dashes. Periods, commas, or middle dots (`·`) instead.
- Each H2 should make sense on its own. People will skim and skip in.
- Cite at least 3 production repos that use this stack at the bottom of AGENTS.md.

## License

By submitting a PR you agree your contribution is released under [CC0 1.0 Universal](LICENSE).
