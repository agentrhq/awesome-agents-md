---
stack_slug: nestjs-10-prisma-redis
display_name: NestJS 10 · Prisma 5 · BullMQ · Redis 7 · Jest 29
components: [nestjs-10, prisma-5, redis-7, bullmq, jest-29, typescript-strict]
verified_with: []
last_verified: 2026-05-27
maintainer: agentr-labs
license: CC0-1.0
---

# NestJS 10 + Prisma + BullMQ + Redis + Jest

The opinionated TypeScript backend stack: dependency injection, decorator-driven modules, Prisma for the database boundary, BullMQ for background work, Jest for tests. Suited to teams that want Angular-style structure on the server.

## Why these choices

- **NestJS over plain Express/Fastify.** DI graph, module system, and a single way to do guards, interceptors, pipes, and filters. Trades flexibility for consistency across a team.
- **Prisma over TypeORM.** Generated client, declarative schema, fewer footguns. Decision is contested if you need complex polymorphic queries; revisit before scaling past 50 models.
- **BullMQ over BullMQ Pro / Inngest / Trigger.dev.** Free, battle-tested, Redis-only. `@nestjs/bullmq` plugs directly into the DI graph so workers share services with the HTTP process.
- **Jest 29 over Vitest.** NestJS's testing primitives (`@nestjs/testing`) target Jest. Vitest works but you'll wire it up yourself.
- **pnpm over npm/yarn.** Speed, strict dep isolation, monorepo-friendly if the product grows.

## What to tune

- If the app is HTTP-only and never enqueues work, drop BullMQ and Redis. Don't keep them "just in case".
- Swap Prisma for Drizzle if you need fine-grained SQL control. Keep the service-layer convention either way.
- For real-time, add `@nestjs/websockets` gateways. They live alongside controllers in the same module.
- Replace `@nestjs/config` with a typed wrapper if env validation becomes the most edited file.

## Verification

Pilot entry. `verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
