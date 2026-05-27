# Verifications

Logged runs of the gallery's `example-prompts.md` against a coding agent, with the resulting code and a pass/fail audit against the AGENTS.md conventions.

## What counts as a verification

A verification is one run of one prompt by one agent against the stack's AGENTS.md. It produces a file under `verifications/<slug>/<agent>-<date>.md` containing:

- The exact prompt that was run.
- The code the agent produced (or a verbatim diff).
- A line-by-line pass/fail check against the AGENTS.md `## Conventions` and `## Don't` sections.
- Any AGENTS.md ambiguity the agent stumbled on, as feedback for the file itself.

## What we have so far

Run on 2026-05-27 by Claude (the LLM, in a chat context, reading the AGENTS.md fresh and producing the code in this same session). This is an **internal coherence check**, not a substitute for a real Claude Code product run or a Codex/Cursor/Jules/Aider run. It confirms the file is internally consistent and a competent LLM can follow it, no more.

- [`nextjs-15-postgres-prisma/claude-self-check-2026-05-27.md`](nextjs-15-postgres-prisma/claude-self-check-2026-05-27.md)
- [`rails-8-sidekiq-postgres/claude-self-check-2026-05-27.md`](rails-8-sidekiq-postgres/claude-self-check-2026-05-27.md)
- [`fastapi-celery-postgres/claude-self-check-2026-05-27.md`](fastapi-celery-postgres/claude-self-check-2026-05-27.md)

## What this does NOT cover

- Real Claude Code product behavior (different from the chat LLM: it has the hook system, MCP servers, tool registry).
- OpenAI Codex, Cursor, Jules, Aider. They have their own quirks that the chat-LLM check can't predict.

Per-stack `verified_with: []` arrays stay empty until contributors run real agents per the [verification runbook](../VERIFICATION.md).
