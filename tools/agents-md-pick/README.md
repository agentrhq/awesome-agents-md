# agents-md-pick

Drop a battle-tested AGENTS.md into your repo. Zero dependencies, Node 18+.

```bash
npx agents-md-pick                       # interactive picker
npx agents-md-pick nextjs-postgres-prisma  # by slug (substring match)
npx agents-md-pick --list                # list every stack
npx agents-md-pick --dry-run go-chi      # print source URL without writing
```

## What it does

1. Resolves the slug (exact or unambiguous substring match) against the [12 stacks in the gallery](https://github.com/agentrhq/awesome-agents-md/tree/main/stacks).
2. Reads the AGENTS.md from a local `stacks/` directory if running from inside the awesome-agents-md repo, otherwise fetches from `raw.githubusercontent.com`.
3. Writes it to `./AGENTS.md` in the current directory. Confirms before overwriting.
4. Prints next-step hints for Claude Code (`ln -s AGENTS.md CLAUDE.md`) and Aider (`ln -s AGENTS.md CONVENTIONS.md`).

## Slug matching

Pass any unique substring set. These all resolve to `nextjs-15-postgres-prisma`:

- `nextjs-15-postgres-prisma`
- `nextjs-postgres-prisma`
- `nextjs-prisma`

If your input matches more than one stack, the CLI prints the candidates and exits.

## License

CC0 1.0 Universal.
