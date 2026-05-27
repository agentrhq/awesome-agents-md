---
stack_slug: ktor-postgres-exposed
display_name: Kotlin 2.3.21 · Ktor 3.5 · Exposed 1.3.0 · Postgres 17 · Kotest · Gradle 8
components: [kotlin-2.3.21, ktor-3.5, exposed-1.3.0, postgres-17, kotest-5, flyway-12.6, gradle-8, testcontainers, jdk-25]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Ktor + Postgres + Exposed + Kotest

A modern Kotlin server stack. Suspend route handlers, Exposed for typed SQL, Postgres via Flyway migrations, Kotest for assertions, Gradle Kotlin DSL for builds.

## Why these choices

- **Kotlin 2.3.21 + Ktor 3.5.** Suspend functions through the entire handler chain. No `CompletableFuture` ceremony, no callback chains.
- **Exposed over jOOQ or JPA.** Lighter than JPA, more Kotlin-native than jOOQ. The cost: less mature than Hibernate, smaller community.
- **Postgres + Flyway.** Plain SQL migrations beat DSL-generated DDL once a schema gets real.
- **Kotest over plain JUnit.** Better assertions, property-based testing, structured spec styles.
- **Netty over CIO.** Netty has the deepest production track record. CIO is fine for low-traffic services.

## What to tune

- Swap Exposed for jOOQ on heavy reporting services. The two coexist on the same connection.
- Drop Koin if the app only has a handful of singletons. Plain wiring in `Application.module()` is enough.
- For full-stack Kotlin, share `@Serializable` DTOs with a Kotlin Multiplatform front end. Move them to a `shared/` module.
- Pin the Postgres image version in Testcontainers to your production version to avoid dialect drift.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
