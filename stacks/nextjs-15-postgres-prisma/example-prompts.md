# Example prompts · Next.js 15 + Postgres + Prisma + Tailwind + Vitest

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/posts` route handler that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a Vitest integration test that hits a real Testcontainers Postgres and asserts the cursor round-trip.

What good looks like: handler in `src/app/api/posts/route.ts`; integration test in `src/tests/integration/posts.test.ts`; uses `prisma.post.findMany` with `take` and `cursor`, no `OFFSET`.

## 2. Server action with validation

> Add a server action `createPost(input)` that creates a Post. Validate `title` (3-200 chars) and `body` (10-50000 chars) via Zod. Return a Result-shaped object, never throw to the client. Add a unit test.

What good looks like: action in `src/server/actions/posts.ts` with `"use server"`, Zod schema in `src/schemas/post.ts`, `Result<Post, ValidationError>` returned.

## 3. Auth-gated component

> Add a `<PostEditor>` client component that mounts only if the user is authenticated. Read the session via the existing `lib/auth.ts`. Show a Tailwind-styled fallback otherwise.

What good looks like: server component wrapper that reads session, conditionally renders the client editor or fallback. No client-side fetch for session.

## 4. Migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to UTC. Write the migration and a backfill, in that order. Two separate migrations.

What good looks like: migration 1 adds nullable column with default; migration 2 backfills existing rows; migration 3 (separate PR) sets NOT NULL. The agent should refuse to combine these.

## 5. External API integration

> Add a `sendWelcomeEmail(userId)` function that sends via Resend. Pull credentials per the External APIs section. Add an MSW unit test that asserts the HTTP request shape without hitting the network.

What good looks like: implementation reads from `lib/env.ts` (option 1), Doppler (option 2), or Authsome (option 3); MSW handler in `tests/setup.ts`; no real network call in the test.
