# AGENTS.md · Java 21 · Spring Boot 3.4 · Spring Data JPA · Flyway · Postgres 17 · JUnit 5 · Testcontainers

## Stack

- **Language:** Java 21 LTS (sealed types, virtual threads, pattern matching for switch). `.sdkmanrc` or `.tool-versions` pins the JDK.
- **Framework:** Spring Boot 3.4 (also valid on the 4.0 line). Spring Web (MVC, not WebFlux unless the service is fully reactive). Spring Security 6.x.
- **Persistence:** Spring Data JPA over Hibernate 6, Postgres 17 via HikariCP. Flyway 11+ for migrations.
- **Build:** Gradle 8.x with the Kotlin DSL (`build.gradle.kts`), Spring Boot plugin, dependency-management plugin. Maven 3.9 works but Gradle is the default for new code.
- **Tests:** JUnit 5 (`spring-boot-starter-test`), Testcontainers for Postgres in integration tests, MockMvc for slice tests, RestAssured optional for full HTTP.
- **Lint:** Spotless with `google-java-format` (CI-blocking), Checkstyle optional. Error Prone for static analysis on main.

## Run

- Install JDK + deps: `sdk env install && ./gradlew --version`
- Build: `./gradlew build` (compiles, runs unit + slice tests, packages a bootJar)
- Boot the app: `./gradlew bootRun` (default port 8080)
- Unit tests only: `./gradlew test`
- Integration tests: `./gradlew integrationTest` (custom source set; spins Testcontainers)
- Format: `./gradlew spotlessApply`
- Format check (CI): `./gradlew spotlessCheck`
- Static analysis: `./gradlew check`

DB:
- New migration: create `src/main/resources/db/migration/V<timestamp>__<slug>.sql`. Numbering is monotonic, never reuse a version.
- Apply: handled at boot, or `./gradlew flywayMigrate` to run standalone.
- Info: `./gradlew flywayInfo`. Repair: `./gradlew flywayRepair` (only after a failed migration).

Expected runtimes: clean build ≤120s, hot test cycle ≤20s, `bootRun` cold start ≤8s. Testcontainers first-run pulls the Postgres image, so initial integration runs are slower.

## Architecture

```
src/main/java/com/<org>/<app>/
├── Application.java               # @SpringBootApplication entrypoint.
├── config/                        # @Configuration beans, security, observability.
├── <feature>/                     # Feature slice. One per bounded context.
│   ├── api/                       # @RestController, DTOs, request mappers.
│   ├── domain/                    # Domain types, services. No Spring annotations except @Service.
│   └── infrastructure/            # JPA entities, repositories, external clients.
└── shared/                        # Cross-cutting types (errors, pagination, audit).

src/main/resources/
├── application.yaml               # Common config. Profile-agnostic.
├── application-dev.yaml           # Local dev overrides.
├── application-prod.yaml          # Prod config. Secrets via env, not committed.
└── db/migration/                  # Flyway SQL. V<ts>__<slug>.sql.

src/test/java/com/<org>/<app>/
├── <feature>/                     # Mirror main/. Slice tests with @WebMvcTest or @DataJpaTest.
└── integration/                   # Full @SpringBootTest with Testcontainers.
```

Feature slices own their package boundary. `api`, `domain`, `infrastructure` exist inside the feature folder, not as top-level layers. The compiler does not enforce this; reviewers do.

## Conventions

- **Package by feature, not by layer.** `com.acme.billing.api.InvoiceController` beats `com.acme.controllers.InvoiceController`.
- **Constructor injection.** No field injection (`@Autowired` on fields). Constructors make tests trivial and dependencies visible.
- **DTOs at the boundary.** Controllers accept and return DTOs, never JPA entities. Entities never leak past `infrastructure`.
- **Transactions:** `@Transactional` on service public methods only. Self-invocation does not trigger the proxy.
- **Pagination:** every list endpoint accepts `Pageable`. Return `Page<T>` or a cursor-based DTO. Never `List<T>` for unbounded resources.
- **Validation:** `@Valid` on request DTOs, Jakarta Bean Validation annotations on the DTO fields. Domain invariants live in domain types, not DTOs.
- **Errors:** throw domain exceptions, translate them in a `@RestControllerAdvice`. Return RFC 7807 problem details.
- **Records over Lombok** for DTOs. Lombok is fine for entities only with `@EqualsAndHashCode(onlyExplicitlyIncluded = true)`.

## Tests

- **Where:** mirror `src/main/java/` under `src/test/java/`. Slice tests next to the slice, integration under `integration/`.
- **Slice tests:** `@WebMvcTest` for controllers (no DB), `@DataJpaTest` for repositories (H2 or Testcontainers Postgres), `@JsonTest` for serializers.
- **Integration:** `@SpringBootTest` with `@Testcontainers` and a `@Container` static Postgres. Share the container across the class.
- **Avoid `@MockBean` storms.** If a test wires 8 mocks, the design is wrong. Test the slice, or write an integration test.
- **No `Thread.sleep`.** Use Awaitility for async assertions, `@Async` boundaries, or scheduled tasks.
- **Data setup:** plain builders or `@Sql` scripts. Avoid heavyweight fixture libraries.

## Ops

- **Container:** Buildpacks via `./gradlew bootBuildImage`, or a hand-written Dockerfile. Distroless base image, run as non-root.
- **Orchestration:** Kubernetes (Deployment + Service + HPA) or ECS Fargate. Embedded Tomcat handles up to a few thousand RPS per pod.
- **Health:** Spring Boot Actuator. Expose `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`, and `/actuator/prometheus` (scraped). Keep `/actuator/env` and friends off in prod.
- **Observability:** Micrometer + the OpenTelemetry exporter (`opentelemetry-spring-boot-starter`). Traces to Tempo/Jaeger, metrics to Prometheus, logs JSON via Logback's `LogstashEncoder`.
- **Migrations in CI/CD:** run `flywayMigrate` as a separate job before the rolling deploy, not at app startup. Multi-pod startup races otherwise.
- **CI:** GitHub Actions with `actions/setup-java@v4` and `gradle/actions/setup-gradle@v4` (build cache + dependency cache). Matrix on JDK 21 only unless you support multiple.

## External APIs

Bind config with `@ConfigurationProperties` and a typed record. Inject the record, not raw `${}` placeholders. Profile-separated YAML for env differences:

```java
@ConfigurationProperties("integrations.stripe")
public record StripeProps(URI baseUrl, String apiKey, Duration timeout) {}
```

`application-prod.yaml` reads secrets from env vars (`STRIPE_API_KEY: ${STRIPE_API_KEY}`), never literals. For production secret rotation, Spring Cloud Vault or AWS Secrets Manager hydrates env at boot.

For zero-redeploy rotation, Authsome injects credentials per provider. See [authsome.dev](https://authsome.dev).

## Don't

- Don't put `@Transactional` on private methods. Proxy-based AOP only intercepts public methods on Spring-managed beans.
- Don't traverse lazy collections outside a transaction. `LazyInitializationException` is the most common Hibernate footgun.
- Don't call `findAll()` on a table that will grow past 10k rows. Use `findAll(Pageable)` or a Specification with a limit.
- Don't put Lombok's `@Data` on JPA entities. The generated `equals`/`hashCode` walks lazy associations and breaks Hibernate identity semantics.
- Don't commit `application-prod.yaml` with real secrets. Use placeholders and env vars.
- Don't return JPA entities from controllers. Map to a DTO. Open-session-in-view papers over the bug at the cost of N+1 queries.
- Don't enable `spring.jpa.open-in-view` in prod. It hides lazy-loading bugs and adds latency.
- Don't run Flyway from `application.yaml` (`spring.flyway.enabled=true`) for multi-pod prod deploys. Race conditions on first boot.

## Vendor notes

- **Codex / agents.md:** canonical. Well under the 32 KiB Codex cap.
- **Cursor:** reads this file. `.cursor/rules/` can mirror per-feature globs.
- **Jules:** root AGENTS.md only.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.
- **IntelliJ AI Assistant:** picks up AGENTS.md as a `Project Guidelines` source when placed at repo root.

---

*Production references:* [spinnaker/spinnaker](https://github.com/spinnaker/spinnaker/blob/main/AGENTS.md) · [halo-dev/halo](https://github.com/halo-dev/halo/blob/main/AGENTS.md) · [alibaba/druid](https://github.com/alibaba/druid/blob/master/AGENTS.md)
