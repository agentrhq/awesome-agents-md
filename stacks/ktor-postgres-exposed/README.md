---
stack_slug: ktor-postgres-exposed
display_name: Kotlin 2.1 · Ktor 3 · Exposed · Postgres 17 · Kotest · Gradle 8
components: [kotlin-2-1, ktor-3, exposed, postgres-17, kotest-5, flyway-11, gradle-8, testcontainers]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Ktor + Postgres + Exposed + Kotest

A modern Kotlin server stack. Suspend route handlers, Exposed for typed SQL, Postgres via Flyway migrations, Kotest for assertions, Gradle Kotlin DSL for builds.

## Why these choices

- **Kotlin 2.1 + Ktor 3.** Suspend functions through the entire handler chain. No `CompletableFuture` ceremony, no callback chains.
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
