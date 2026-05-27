# AGENTS.md · Kotlin 2.1 · Ktor 3 · Exposed · Postgres 17 · Kotest · Gradle 8

## Stack

- **Language:** Kotlin 2.1 on JDK 21. `.tool-versions` pins both (mise or asdf).
- **Framework:** Ktor 3.0+ on the Netty engine. Coroutines throughout. `suspend fun` route handlers.
- **ORM:** Exposed (JetBrains) with the DAO API for entities and the DSL for queries. jOOQ is a valid alternative for query-heavy services.
- **Database:** Postgres 17. HikariCP connection pool. Flyway 11+ for migrations via the Gradle plugin.
- **Tests:** Kotest 5.9+ (`FunSpec` or `BehaviorSpec`) or JUnit 5 + Kotlin Test. Testcontainers for Postgres.
- **Build:** Gradle 8.x with the Kotlin DSL. Ktor plugin for application packaging.
- **Lint/format:** ktlint (CI-blocking via `ktlintCheck`), detekt for static analysis.

## Run

- Install: `./gradlew --refresh-dependencies build` (compiles, runs tests, packages a fat jar)
- Run app: `./gradlew run` (port 8080)
- Dev autoreload: `./gradlew -t :app:run` (continuous build) or use the Ktor IntelliJ run config with `development = true`
- Tests: `./gradlew test`
- Tests, one class: `./gradlew test --tests "com.acme.UserServiceTest"`
- Format: `./gradlew ktlintFormat`
- Lint: `./gradlew ktlintCheck detekt`
- Fat jar: `./gradlew shadowJar`

DB:
- New migration: drop SQL into `src/main/resources/db/migration/V<timestamp>__<slug>.sql`.
- Migrate: `./gradlew flywayMigrate`. Info: `./gradlew flywayInfo`. Clean (dev only): `./gradlew flywayClean`.
- Never run `flywayClean` against a non-local DB. The plugin task is unguarded.

Expected runtimes: clean Gradle build ≤90s with the build cache primed, `./gradlew run` cold start ≤3s, full test run ≤30s on a hot test DB. The first Kotlin compile is slower.

## Architecture

```
src/main/kotlin/com/<org>/<app>/
├── Application.kt                 # main() and Application.module() entrypoints.
├── plugins/                       # install(ContentNegotiation), install(Authentication), etc.
│   ├── Serialization.kt
│   ├── Security.kt
│   └── Monitoring.kt
├── <feature>/                     # Feature slice. One per bounded context.
│   ├── api/                       # Route definitions: fun Route.userRoutes().
│   ├── domain/                    # Pure Kotlin services. No Ktor or Exposed imports.
│   └── infrastructure/            # Exposed tables, repository implementations.
└── shared/                        # Errors, pagination, config helpers.

src/main/resources/
├── application.conf               # HOCON config. Profile-agnostic.
├── application.yaml               # Optional override.
└── db/migration/                  # Flyway SQL. V<ts>__<slug>.sql.

src/test/kotlin/com/<org>/<app>/
├── <feature>/                     # Mirror main/.
└── integration/                   # testApplication { } with a Testcontainers Postgres.
```

`Application.module()` is the wiring point. Each feature exposes `fun Application.installUserFeature()` and the module composes them. Don't bury route registration inside `main()`.

## Conventions

- **Package by feature.** `com.acme.billing.api.invoiceRoutes` beats `com.acme.routes.InvoiceRoutes`.
- **Coroutines:** every route handler is `suspend`. Wrap blocking JDBC calls with `newSuspendedTransaction(Dispatchers.IO) { }`.
- **DTOs at the boundary.** Routes accept and return `@Serializable` data classes, never Exposed `Entity` instances.
- **Validation:** validate the parsed DTO with `require`/`check` or `kotlinx-validation`. Translate exceptions in a `StatusPages` plugin.
- **Pagination:** every list route accepts `cursor` and `limit` query params. Return `PagedResponse<T>(items, nextCursor)`. Never unbounded.
- **Errors:** throw typed exceptions (`NotFoundException`, `ValidationException` from `shared/errors.kt`). Map them in `StatusPages`.
- **Logging:** `kotlin-logging` (`private val log = KotlinLogging.logger {}`). Logback JSON encoder for prod, console pattern for dev via `logback.xml` profile selectors.
- **Dependency injection:** Koin if the app needs DI. Otherwise plain constructor wiring in `Application.module()`. Don't reach for Hilt or Dagger here.

## Tests

- **Where:** mirror `src/main/kotlin/` under `src/test/kotlin/`. File names end `Test` or `Spec` (Kotest).
- **Route tests:** `testApplication { application { module() }; client.get("/users") }`. No fake servers.
- **DB tests:** spin a Testcontainers Postgres once per test class, run migrations against it, share via a Kotest `Listener` or JUnit `@TestInstance(PER_CLASS)`.
- **Transactional rollback per test:** wrap each test in a transaction that rolls back, or truncate tables in `afterTest`. Pick one and stick to it.
- **External HTTP:** Ktor `MockEngine` for `HttpClient` tests, no real network.
- **No `Thread.sleep`.** Use `runTest { advanceTimeBy(...) }`, `eventually` (Kotest), or `await` from kotlinx-coroutines-test.

## Ops

- **Container:** Ktor's `installDist` task plus a small Dockerfile. JDK 21 distroless base, run as non-root.
- **Hosting:** Fly.io, Render, Railway, or a plain VPS. Heroku-style buildpacks also work. For higher scale, ECS Fargate or GKE.
- **Health:** a `/health` route that pings the DB. `/metrics` exposed via the Ktor Micrometer plugin. Prometheus scrapes it.
- **Observability:** OpenTelemetry Kotlin SDK with the Ktor `KtorServerTracing` plugin. Logs to stdout JSON, shipped by the platform.
- **Migrations:** run `flywayMigrate` as a separate CI step before the rolling deploy. Not in `Application.module()`.
- **CI:** GitHub Actions with `actions/setup-java@v4` and `gradle/actions/setup-gradle@v4` for the build cache. Single matrix entry on JDK 21.

## External APIs

Ktor reads HOCON from `src/main/resources/application.conf`. Bind typed config with `ApplicationConfig` extension or a small `Config` data class loaded in `Application.module()`:

```kotlin
data class StripeConfig(val baseUrl: Url, val apiKey: String, val timeoutMs: Long)

fun ApplicationConfig.stripe() = StripeConfig(
    baseUrl = Url(property("integrations.stripe.baseUrl").getString()),
    apiKey = property("integrations.stripe.apiKey").getString(),
    timeoutMs = property("integrations.stripe.timeoutMs").getString().toLong(),
)
```

`application.conf` references env (`apiKey = ${?STRIPE_API_KEY}`); never literals. For prod rotation use AWS Secrets Manager, Doppler, or HashiCorp Vault to inject env at boot.

For zero-redeploy rotation, Authsome injects credentials per provider. See [authsome.dev](https://authsome.dev).

## Don't

- Don't call blocking JDBC from a `suspend` route handler. Wrap with `newSuspendedTransaction(Dispatchers.IO) { }` so coroutines stay cooperative.
- Don't use `GlobalScope.launch`. Structured concurrency only. Spawn from `application.coroutineScope` or a feature-owned `CoroutineScope`.
- Don't nest `transaction { transaction { } }` calls across threads. Exposed reuses the outer connection; cross-thread reuse deadlocks on Postgres.
- Don't `Database.connect(url)` per request. Connect once in `Application.module()` and keep the reference.
- Don't return Exposed `Entity` instances from a route. They lazy-load on access and serialization happens outside the transaction.
- Don't hardcode `embeddedServer(Netty, ...)` in tests if you want to swap engines later. Use the `EngineMain` entrypoint.
- Don't put secrets in `application.conf` literals. Use `${?ENV_VAR}` substitution.
- Don't paginate with `OFFSET` past a few thousand rows. Use keyset pagination on an indexed column.

## Vendor notes

- **Codex / agents.md:** canonical. Comfortably under the 32 KiB Codex cap.
- **Cursor:** reads this file. Pair with `.cursor/rules/kotlin.mdc` for IDE-specific globs.
- **Jules:** root AGENTS.md only.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.
- **IntelliJ AI Assistant:** picks up AGENTS.md as a `Project Guidelines` source when placed at repo root.

---

*Production references:* [ktorio/ktor](https://github.com/ktorio/ktor/blob/main/AGENTS.md) · [kosi-libs/Kodein](https://github.com/kosi-libs/Kodein/blob/master/AGENTS.md) · [projectNEWM/newm-server](https://github.com/projectNEWM/newm-server/blob/master/AGENTS.md)
