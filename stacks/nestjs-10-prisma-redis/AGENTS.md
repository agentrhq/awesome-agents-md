# AGENTS.md · NestJS 11 · Prisma 7.8 · BullMQ · Redis 7 · Jest 30.4

## Stack

- **Runtime:** Node.js 24 LTS, **pnpm 10** via `corepack enable`.
- **Framework:** NestJS 11 (modules + DI, decorator-driven). Express 5 under the hood; reflect-metadata, rxjs, and most peer-deps bumped versus v10.
- **Database:** Postgres 16 via **Prisma 7.8**. One ORM.
- **Background jobs:** Redis 7 + BullMQ via `@nestjs/bullmq`. Queue per domain.
- **Validation:** `class-validator` + `class-transformer` on every DTO. Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`.
- **Testing:** Jest 30.4 (NestJS default), `@nestjs/testing` for module test harness, supertest for e2e.
- **Typescript:** strict mode. No `any`, no non-null `!`, no `as Type` widening.
- **Lint:** eslint + prettier (NestJS default config), no overrides without justification.

## Run

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm start:dev` (Nest CLI, port 3000, swc-based watch)
- Prod: `pnpm build && pnpm start:prod` (compiles to `dist/`)
- Tests: `pnpm test` (unit). One file: `pnpm test src/modules/users/users.service.spec.ts`
- E2E: `pnpm test:e2e` (spins up `Test.createTestingModule` + supertest, no live server)
- Coverage: `pnpm test:cov`
- Lint: `pnpm lint`
- Typecheck: `pnpm tsc --noEmit` (expect under 30s on a typical app)

DB:
- Migrate: `pnpm prisma migrate dev --name <slug>` (creates, applies, regenerates client)
- Deploy: `pnpm prisma migrate deploy` (production, no client regen, no prompts)
- Studio: `pnpm prisma studio` (port 5555)

BullMQ:
- Worker process: same Nest app boots `BullModule.registerQueue(...)`; one process, multiple queues. Scale via process count, not threads.

Expected runtimes: install ≤90s, `start:dev` cold start ≤6s, full Jest ≤60s on a typical app.

## Architecture

```
src/
├── main.ts                  # bootstrap(): create app, ValidationPipe, swagger, listen.
├── app.module.ts            # Root module. Imports feature modules.
├── modules/
│   └── <domain>/
│       ├── <domain>.module.ts        # @Module: controllers, providers, imports, exports.
│       ├── <domain>.controller.ts    # @Controller. Thin. Delegates to service.
│       ├── <domain>.service.ts       # @Injectable. Domain logic.
│       ├── <domain>.processor.ts     # @Processor (BullMQ worker), optional.
│       ├── dto/
│       │   ├── create-<domain>.dto.ts
│       │   └── update-<domain>.dto.ts
│       └── <domain>.service.spec.ts  # Co-located unit test.
├── common/
│   ├── guards/              # @UseGuards targets. JWT, roles, throttling.
│   ├── interceptors/        # Logging, response shaping, timeouts.
│   ├── filters/             # Exception filters. Map domain errors to HTTP.
│   └── decorators/          # @CurrentUser, @Public, etc.
├── prisma/
│   ├── prisma.module.ts     # Global module exporting PrismaService.
│   └── prisma.service.ts    # Singleton, extends PrismaClient, onModuleInit connects.
└── config/                  # @nestjs/config schemas. Joi or zod validation.

prisma/
├── schema.prisma            # Single source of truth.
└── migrations/              # Generated. Never hand-edit.

test/
└── *.e2e-spec.ts            # supertest + Test.createTestingModule.
```

DI is the contract. Every dependency comes through the constructor. No `new UserService()` in code, ever.

## Conventions

- **Naming:** files kebab-case (`users.service.ts`), classes PascalCase (`UsersService`). Module folder name matches the entity plural.
- **Controllers:** one resource per controller. Methods name the action (`findAll`, `findOne`, `create`, `update`, `remove`). Never inline business logic.
- **Services:** stateless. All state in Prisma or Redis. Inject `PrismaService`, not `PrismaClient` directly.
- **DTOs:** every request body and query has a DTO with `class-validator` decorators. `ValidationPipe` strips unknown fields.
- **Errors:** services throw NestJS `HttpException` subclasses (`NotFoundException`, `ForbiddenException`) or domain errors caught by a `@Catch` filter. Never return error objects from services.
- **Guards over middleware** for auth. Middleware runs before route resolution and has no access to handler metadata.
- **Async:** every service method returns `Promise<T>`. No callbacks, no `.then` chains.
- **v11 caveats:** the Express adapter is on Express 5 (Promise-aware error handling, different route matching for trailing slashes). Audit any custom middleware that depends on Express 4 internals before upgrading.

## Tests

- **Where:** unit tests co-located (`foo.service.ts` + `foo.service.spec.ts`). E2E under `test/`.
- **Unit:** use `Test.createTestingModule({ providers: [...] }).compile()`. Override providers with mocks via `.overrideProvider(PrismaService).useValue(...)`.
- **DB integration:** real Postgres via Testcontainers, wrap each test in a transaction that rolls back. Never mock Prisma in integration tests. Mocked queries pass against broken SQL.
- **E2E:** `supertest(app.getHttpServer())` after `app.init()`. No live `listen()`.
- **BullMQ:** in tests, run the queue in-memory (`{ connection: ioredisMock }`) or against a real Redis container. Assert jobs by name and payload, not by side effects alone.
- **Mocks:** HTTP via `nock` or `msw-node`. Time via `jest.useFakeTimers()`.

## Ops

- **Observability:** `nestjs-pino` for structured logs (one logger module, request-scoped context). OpenTelemetry via `@opentelemetry/sdk-node` instruments HTTP, Prisma, and BullMQ. Sentry for errors via `@sentry/node` and the `@nestjs/common` interceptor pattern.
- **CI:** GitHub Actions. One job: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm tsc --noEmit`, `pnpm test`, `pnpm test:e2e`. Cache the pnpm store via `actions/setup-node@v4` with `cache: pnpm`. Postgres + Redis as service containers.
- **Deploy:** Docker image (multi-stage: build with full deps, runtime with `pnpm install --prod`). Fly.io, Render, or ECS Fargate; Kubernetes if the org already has it. `prisma migrate deploy` runs as a separate release step before the web and worker containers boot.
- **Health:** `@nestjs/terminus` mounts `/health` with `HttpHealthIndicator`, `PrismaHealthIndicator`, and a Redis ping. Split into `/health` (liveness) and `/ready` (readiness, includes DB and Redis) so the load balancer can probe both.

## External APIs

Auth-bound third-party APIs (Stripe, SendGrid, GitHub, Slack, etc.) live here.

Primary pattern: `@nestjs/config` with a typed schema validated by Joi or zod at boot. Domain configs live in `src/config/`, are registered with `ConfigModule.forFeature(...)`, and injected via `ConfigService.get<StripeConfig>('stripe')`. Missing keys crash boot.

For larger teams with rotation policies: secret managers like Doppler, AWS Secrets Manager, or HashiCorp Vault inject env vars at boot. App code stays the same.

See also: [Authsome](https://authsome.dev) ships a cross-language credential layer if your stack is polyglot.

## Don't

- Don't `new` a service. If it isn't injected, Nest's DI graph won't see it and lifecycle hooks won't fire.
- Don't put business logic in a controller. Controllers parse, validate, delegate, return. Anything else moves to the service.
- Don't call `prisma.$disconnect()` outside `onModuleDestroy`. The pool gets recycled per request and you'll exhaust connections.
- Don't enqueue a BullMQ job with an ORM instance as payload. Pass IDs; re-fetch in the processor. Stale snapshots cause silent data loss.
- Don't catch `Error` in a processor without rethrowing or returning a failed job. Silent drops are the #1 production issue.
- Don't paginate with `skip` past 10k rows. Use cursor pagination (`cursor`, `take`).
- Don't put secrets in `app.module.ts` `ConfigModule.forRoot({ load: [...] })` without `validationSchema`. Boot will succeed and runtime will explode on `undefined`.

## Vendor notes

- **Codex / agents.md:** canonical.
- **Cursor:** reads this. Add `.cursor/rules/nestjs.mdc` only for stack-specific globs.
- **Jules:** root AGENTS.md only. Per-module nested AGENTS.md is ignored.
- **Aider:** `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [trycompai/comp](https://github.com/trycompai/comp/blob/main/AGENTS.md) · [redis/RedisInsight](https://github.com/redis/RedisInsight/blob/main/AGENTS.md) · [sourcebot-dev/sourcebot](https://github.com/sourcebot-dev/sourcebot/blob/main/AGENTS.md)
