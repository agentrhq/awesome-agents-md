# Verification runbook

`verified_with` arrays in `stacks/<slug>/README.md` stay empty until a maintainer or contributor runs the file through one of the supported agents and attaches the logs. This document is the procedure.

## Why this exists

The repo's tagline says "verified against Codex, Cursor, Jules, Aider". That claim is only honest when a real human has watched a real agent follow the file. This runbook makes the procedure repeatable and the criteria explicit.

## Supported agents

- **OpenAI Codex** (`@openai/codex` CLI, or `codex` web)
- **Cursor** (current stable channel)
- **Google Jules** (web app)
- **Aider** (`pip install aider-chat`, current stable)

Claude Code reads AGENTS.md via the `ln -s AGENTS.md CLAUDE.md` workaround; verifying against it is a bonus, not required for the `verified_with` array.

## Stock prompts

Pick at least three of the five prompts from the target stack's `stacks/<slug>/example-prompts.md`. Run each through every agent you want to claim verification for. The five categories every entry covers:

1. Paginated endpoint or list query
2. Idempotent background job
3. Schema migration with backfill
4. Refactor or extraction
5. External API integration

## Pass criteria

An agent passes for a stack if **at least 3 of 5 prompts** produce compilable, convention-following code on the first attempt. Specifically:

- Uses the test runner the AGENTS.md specifies.
- Puts new files in the directories the Architecture section maps.
- Respects the conventions listed (file size, naming, error type, etc.).
- Avoids every anti-pattern in the `## Don't` section that applies.
- Picks the external-API pattern the file recommends.

"Compilable" means the code passes the project's typecheck step on the first run (`pnpm typecheck`, `cargo check`, `dotnet build`, `mix compile`, etc.). One follow-up nudge to fix an obvious typo is fine. More than that is a fail.

## Procedure

1. Clone a real project of the target stack into a scratch directory.
2. Copy the gallery's AGENTS.md to its repo root: `npx agents-md-pick <slug>`.
3. Symlink for Claude Code if testing it: `ln -s AGENTS.md CLAUDE.md`.
4. For each agent under test:
   - Open a fresh session in that project directory.
   - Run the first three prompts from `example-prompts.md`.
   - Save the agent's terminal output (or screenshots for web agents) to `/tmp/verify-<slug>-<agent>.txt`.
   - Record pass or fail per prompt.
5. Open a PR that updates the stack's `README.md` frontmatter:
   - Set `verified_with` to the list of agents that passed at least 3 of 5 prompts.
   - Update `last_verified` to today's ISO date.
   - Attach the log files to the PR (drag into the description, or paste excerpts).

## Honest disclosure

If an agent fails on a stack, do not silently drop it from `verified_with`. Open an issue tagged `needs-<agent>-verification` and note which prompts failed and how. The point is an honest signal, not a clean badge.

## CI gating (future)

When stacks accumulate `verified_with: [codex, cursor, jules, aider]` for the four listed agents, we can drop the disclaimer in the top-level README. Until then it stays.

## What this does not cover

- Production correctness. The AGENTS.md shapes how the agent writes code; the team running it owns whether that code is correct.
- Vendor-specific quirks beyond what the `## Vendor notes` section describes. File issues per stack if you find new ones.
- Long-tail prompts. Verifying five prompts catches the common cases. Edge cases need their own coverage.
