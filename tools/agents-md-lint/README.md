# agents-md-lint

Lint an AGENTS.md against the [awesome-agents-md](https://github.com/agentrhq/awesome-agents-md) schema. Zero dependencies, Node 18+.

```bash
npx agents-md-lint                 # lint AGENTS.md under cwd recursively
npx agents-md-lint AGENTS.md       # lint a specific file
npx agents-md-lint stacks/         # lint every AGENTS.md under a directory
```

## What it checks

1. The 8 required H2 sections are present, in this order:
   `## Stack`, `## Run`, `## Architecture`, `## Conventions`, `## Tests`, `## External APIs`, `## Don't`, `## Vendor notes`.
2. File length is ≤ 200 lines. Longer files [measurably hurt agent performance](https://reddit.com/r/ClaudeAI/comments/1r7mvja/new_research_agentsmd_files_reduce_coding_agent/).
3. No em-dashes (`—`). Periods, commas, or middle dots (`·`) instead.

## Exit codes

- `0` clean
- `1` lint failed
- `2` no `AGENTS.md` found

## Output

```text
ok  stacks/nextjs-15-postgres-prisma/AGENTS.md
stacks/foo/AGENTS.md:1: missing required section '## Don't'
stacks/foo/AGENTS.md:42: em-dash found (use period, comma, or middle dot)

2 error(s); 11/12 file(s) clean
```

## License

CC0 1.0 Universal.
