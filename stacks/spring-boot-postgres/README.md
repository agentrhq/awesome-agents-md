---
stack_slug: spring-boot-postgres
display_name: Java 21 · Spring Boot 3.4 · Spring Data JPA · Flyway · Postgres 17 · JUnit 5 · Testcontainers
components: [java-21, spring-boot-3-4, spring-data-jpa, flyway-11, postgres-17, junit-5, testcontainers, gradle-8]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Spring Boot + Postgres + JPA + Flyway + JUnit + Testcontainers

The default enterprise JVM web service stack. Constructor-injected services, JPA over Postgres with Flyway-managed schema, JUnit 5 + Testcontainers for the test ladder, Gradle with the Kotlin DSL for builds.

## Why these choices

- **Java 21 LTS.** Virtual threads make the synchronous `RestController` model competitive with reactive without the cognitive cost of `Mono`/`Flux`.
- **Spring Boot 3.4.** Convention-over-config, native compilation path exists if you need it, broad library coverage.
- **JPA over jOOQ or plain JDBC.** Productive for CRUD-shaped domains. The cost: implicit queries, lazy loading footguns. For OLAP or heavy reporting, drop in jOOQ alongside.
- **Flyway over Liquibase.** Plain SQL migrations are easier to review than XML changesets.
- **Testcontainers over H2.** H2 lies. Real Postgres in tests catches dialect drift early.
- **Gradle Kotlin DSL over Maven.** Faster, typed build scripts, better build cache.

## What to tune

- Swap MVC for WebFlux if you genuinely need backpressure. Most CRUD services do not.
- Drop Spring Security if the service sits behind an authenticating gateway.
- For high-cardinality read APIs, add jOOQ or Spring Data JDBC alongside JPA.
- Pin the Postgres version in `application.yaml` to match the Testcontainers image to avoid feature-drift surprises.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
