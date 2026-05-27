---
stack_slug: nestjs-10-prisma-redis
display_name: NestJS 11 · Prisma 6 · BullMQ · Redis 7 · Jest 29
components: [nestjs-11, prisma-6, redis-7, bullmq, jest-29, typescript-strict, node-22, express-5]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# NestJS 11 + Prisma 6 + BullMQ + Redis + Jest

The opinionated TypeScript backend stack: dependency injection, decorator-driven modules, Prisma for the database boundary, BullMQ for background work, Jest for tests. Suited to teams that want Angular-style structure on the server. Slug stays `nestjs-10-prisma-redis` for stable URLs; the file itself targets NestJS 11.

## Why these choices

- **NestJS 11 over 10.** v11 ships on Express 5 with updated peer-deps (rxjs 7, reflect-metadata 0.2). Most v10 apps upgrade by re-running `nest update` and auditing any custom Express middleware. CommonJS shims still work for stragglers.
- **NestJS over plain Express/Fastify.** DI graph, module system, and a single way to do guards, interceptors, pipes, and filters. Trades flexibility for consistency across a team.
- **Prisma 6 over TypeORM.** Generated client, declarative schema, fewer footguns. Decision is contested if you need complex polymorphic queries; revisit before scaling past 50 models.
- **BullMQ over Inngest / Trigger.dev.** Free, mature, Redis-only. `@nestjs/bullmq` plugs directly into the DI graph so workers share services with the HTTP process.
- **Jest 29 over Vitest.** NestJS's testing primitives (`@nestjs/testing`) target Jest. Vitest works but you'll wire it up yourself.
- **pnpm 10 over npm/yarn.** Speed, strict dep isolation, monorepo-friendly if the product grows. Node 22 LTS.

## What to tune

- If the app is HTTP-only and never enqueues work, drop BullMQ and Redis. Don't keep them on standby.
- Swap Prisma for Drizzle if you need fine-grained SQL control. Keep the service-layer convention either way.
- For real-time, add `@nestjs/websockets` gateways. They live alongside controllers in the same module.
- Replace `@nestjs/config` with a typed wrapper if env validation becomes the most edited file.
- If you stay on NestJS 10 for a quarter, drop the v11/Express 5 caveats and pin `@nestjs/*@^10`.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
