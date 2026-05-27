# Self-check · Next.js 15 + Postgres + Prisma · 2026-05-27 · Claude (LLM)

This is an internal coherence check, not a real Claude Code product run. The point is to confirm the AGENTS.md is internally consistent and shapes the code a competent LLM produces. See [`verifications/README.md`](../README.md) for the limits of this exercise.

## Prompt

From `stacks/nextjs-15-postgres-prisma/example-prompts.md`, prompt 1:

> Add a `GET /api/posts` route handler that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a Vitest integration test that hits a real Testcontainers Postgres and asserts the cursor round-trip.

## Code produced

**`src/app/api/posts/route.ts`**

```typescript
import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { listPosts } from "@/server/services/posts";

const QuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  take: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    take: url.searchParams.get("take") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }

  const { posts, nextCursor } = await listPosts(parsed.data);
  return NextResponse.json({ posts, nextCursor });
}
```

**`src/server/services/posts.ts`**

```typescript
import "server-only";
import { db } from "@/lib/db";

type ListInput = { cursor?: string; take: number };

export async function listPosts({ cursor, take }: ListInput) {
  const rows = await db.post.findMany({
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = rows.length > take;
  const posts = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? posts[posts.length - 1]?.id : null;

  return { posts, nextCursor };
}
```

**`src/tests/integration/posts.test.ts`**

```typescript
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { db } from "@/lib/db";
import { listPosts } from "@/server/services/posts";

let pg: StartedPostgreSqlContainer;

beforeAll(async () => {
  pg = await new PostgreSqlContainer("postgres:16-alpine").start();
  process.env.DATABASE_URL = pg.getConnectionUri();
  execSync("pnpm prisma migrate deploy", { stdio: "inherit", env: process.env });
}, 60_000);

afterAll(async () => {
  await pg.stop();
});

beforeEach(async () => {
  await db.post.deleteMany();
});

describe("listPosts cursor pagination", () => {
  it("round-trips a cursor across two pages", async () => {
    const created = await Promise.all(
      Array.from({ length: 45 }, (_, i) =>
        db.post.create({
          data: { title: `post ${i}`, body: "x", createdAt: new Date(2026, 0, i + 1) },
        })
      )
    );

    const page1 = await listPosts({ take: 20 });
    expect(page1.posts).toHaveLength(20);
    expect(page1.nextCursor).toBeTruthy();
    expect(page1.posts[0].createdAt.getTime()).toBeGreaterThan(page1.posts[19].createdAt.getTime());

    const page2 = await listPosts({ take: 20, cursor: page1.nextCursor! });
    expect(page2.posts).toHaveLength(20);
    const ids1 = new Set(page1.posts.map(p => p.id));
    for (const p of page2.posts) {
      expect(ids1.has(p.id)).toBe(false);
    }

    const page3 = await listPosts({ take: 20, cursor: page2.nextCursor! });
    expect(page3.posts).toHaveLength(5);
    expect(page3.nextCursor).toBeNull();
  });
});
```

## AGENTS.md compliance check

| Convention | Pass? | Note |
|---|---|---|
| Cursor pagination, no `OFFSET` | yes | Uses Prisma `cursor` + `skip: 1` + `take`. |
| File location: `src/app/api/posts/route.ts` | yes | App Router handler. |
| Service in `src/server/services/posts.ts` | yes | Domain logic separated from HTTP. |
| Server-only marker | yes | `import "server-only"` at the top of both server files. |
| Zod validation on input | yes | `QuerySchema` validates query params, returns 400 on failure. |
| No raw SQL | yes | Prisma only. |
| Integration test at `src/tests/integration/` | yes | Per the `## Architecture` map. |
| Real Postgres via Testcontainers, never mock Prisma | yes | `PostgreSqlContainer` from `@testcontainers/postgresql`. |
| `pnpm prisma migrate deploy` for prod migrations | yes | Used in test setup to apply schema to the container DB. |
| TypeScript strict (no `any`, no `as` widening) | yes | Inferred types only. One `!` on the cursor in test (acceptable since the test asserts truthy first). |
| Errors via named subclasses | n/a | Path returns 400 directly; not throwing. Could route through `lib/errors.ts` if the team prefers. |

## Ambiguity feedback (what the AGENTS.md could clarify)

1. **Error routing.** The file says "throw named subclasses... catch at the route boundary". The cleanest read for a 400 (bad input) is `return NextResponse.json({error}, {status: 400})` rather than throwing. The AGENTS.md doesn't explicitly carve out validation errors. A line clarifying "for invalid input, return JSON with status 400, no throw" would close that gap.
2. **Take cap.** The AGENTS.md says "page size 20" in the prompt but doesn't put a maximum on `take`. I added a `max(50)` cap defensively. Either codify a default cap in `## Conventions` or leave it explicit per route.
3. **Testcontainers boot time.** The test setup spins up Postgres + runs migrations on every file. For repos with many integration tests, that's slow. AGENTS.md could note: "Share the container at the test runner level (Vitest `globalSetup`) when test count grows."

## Result

The file is internally coherent. A reasonable agent following it produces code that respects: cursor-only pagination, architectural layering, server-only boundaries, Zod validation, real Postgres in integration tests. Three small gaps (validation error routing, take cap, Testcontainers performance) would tighten it further.
