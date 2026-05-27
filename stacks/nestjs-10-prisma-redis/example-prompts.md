# Example prompts · NestJS 10 + Prisma + BullMQ + Redis + Jest

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /posts` endpoint on `PostsController` that returns posts with cursor pagination. Page size 20, sorted by `createdAt` desc. Include a Jest unit test for the service and an e2e test via supertest.

What good looks like: `findAll(cursor?: string)` on `PostsService` using `prisma.post.findMany({ take: 20, cursor, skip: cursor ? 1 : 0, orderBy: { createdAt: 'desc' } })`; controller method validates the `cursor` query via a DTO; service spec uses `Test.createTestingModule` and overrides `PrismaService`; e2e spec runs against `app.getHttpServer()`. No `skip`-based offset pagination.

## 2. Idempotent background job

> Add a BullMQ job `send-welcome-email` triggered when a user is created. Processor must be safe to retry. Add a Jest test that runs the processor directly.

What good looks like: queue registered via `BullModule.registerQueue({ name: 'emails' })` in the module; producer in `UsersService.create` enqueues with `{ removeOnComplete: true, attempts: 5, backoff: { type: 'exponential', delay: 5000 } }`; processor in `EmailsProcessor` with `@Processor('emails')`, marks user as `welcomeEmailSentAt` before sending (idempotent guard); test instantiates the processor via DI and asserts behavior.

## 3. Migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to `UTC`. Write the Prisma migrations and the backfill, in order. Separate migrations.

What good looks like: migration 1 adds the nullable column with default `UTC`; migration 2 is a hand-written SQL data migration (`prisma migrate dev --create-only` then edit) that backfills `NULL` rows in batches; migration 3 (separate PR) sets the column `NOT NULL` via `@db.NotNull` and reruns `prisma migrate dev`. Agent refuses to collapse these and explains the rollout risk.

## 4. Refactor a fat controller into a service

> The `OrderController.create` handler is 100 lines and does Stripe charging, inventory updates, and email enqueueing inline. Extract an `OrdersService.placeOrder(dto, user)` method. Inject what it needs. Keep behavior identical and add a spec.

What good looks like: new `placeOrder` method on `OrdersService`, dependencies (`PrismaService`, `StripeService`, `@InjectQueue('emails')`) injected via constructor; controller shrinks to validate DTO, call service, return result; service spec uses `Test.createTestingModule` overriding each dependency; no `new` keyword for services anywhere.

## 5. External API integration

> Add a `chargeCard(orderId)` method that calls Stripe. Pull credentials per the External APIs section. Add a Jest unit test using `nock` that asserts the request shape without hitting the network.

What good looks like: implementation reads credentials from `@nestjs/config` (option 1), Doppler (option 2), or Authsome (option 3); `StripeService` is `@Injectable()` and constructor-injected into `OrdersService`; nock matcher on URL, headers, and body; no real HTTP. The charge call is invoked from a service or BullMQ processor, never directly from a controller.
