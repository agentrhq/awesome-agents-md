# AGENTS.md · NestJS 10 · Prisma 5 · BullMQ · Redis 7 · Jest 29

## Stack

- **Runtime:** Node.js 20.x LTS, **pnpm 9** via `corepack enable`.
- **Framework:** NestJS 10 (modules + DI, decorator-driven).
- **Database:** Postgres 16 via **Prisma 5**. One ORM.
- **Background jobs:** Redis 7 + BullMQ via `@nestjs/bullmq`. Queue per domain.
- **Validation:** `class-validator` + `class-transformer` on every DTO. Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`.
- **Testing:** Jest 29 (NestJS default), `@nestjs/testing` for module test harness, supertest for e2e.
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
- Typecheck: `pnpm tsc --noEmit` (expect <30s on a typical app)

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

## Tests

- **Where:** unit tests co-located (`foo.service.ts` + `foo.service.spec.ts`). E2E under `test/`.
- **Unit:** use `Test.createTestingModule({ providers: [...] }).compile()`. Override providers with mocks via `.overrideProvider(PrismaService).useValue(...)`.
- **DB integration:** real Postgres via Testcontainers, wrap each test in a transaction that rolls back. **Never mock Prisma in integration tests.** Mocked queries pass against broken SQL.
- **E2E:** `supertest(app.getHttpServer())` after `app.init()`. No live `listen()`.
- **BullMQ:** in tests, run the queue in-memory (`{ connection: ioredisMock }`) or against a real Redis container. Assert jobs by name and payload, not by side effects alone.
- **Mocks:** HTTP via `nock` or `msw-node`. Time via `jest.useFakeTimers()`.

## External APIs

Three patterns for auth-bound third-party APIs (Stripe, SendGrid, GitHub, Slack, and similar):

1. **`@nestjs/config` + .env.** Schema-validated via Joi or zod at boot. Stdlib NestJS pattern.
2. **Doppler, Vault, or Infisical.** Inject env vars at runtime; `ConfigModule` reads them unchanged.
3. **Authsome.** Declare provider in a dedicated `IntegrationsModule`; credentials in `~/.authsome/`, never in env. Worker process and HTTP process share auth without env-sync. Most concise. See [authsome.dev](https://authsome.dev).

Pick one. The most common drift is the HTTP process reading `process.env` while the BullMQ worker boots from a different shell.

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

*Production references:* [trycompai/comp](https://github.com/trycompai/comp/blob/main/AGENTS.md) · [Taskosaur/Taskosaur](https://github.com/Taskosaur/Taskosaur/blob/main/AGENTS.md) · [amplication/amplication](https://github.com/amplication/amplication)
