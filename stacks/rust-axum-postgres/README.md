---
stack_slug: rust-axum-postgres
display_name: Rust 1.80 · Axum 0.7 · sqlx 0.8 · Postgres 16 · tokio 1
components: [rust-1.80, axum-0.7, sqlx-0.8, postgres-16, tokio-1, thiserror-1]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Rust + Axum + sqlx + Postgres + tokio

The boring-good Rust web stack. Compile-time checked SQL, typed handlers, structured errors, and a runtime that doesn't surprise you.

## Why these choices

- **Axum over Actix.** Built on tower, plays cleanly with the rest of the tokio ecosystem. Typed extractors mean handler signatures document the contract.
- **sqlx over Diesel.** Async first. `query!` macros check SQL against your live schema at compile time. No DSL to fight.
- **`thiserror` + `IntoResponse`.** One error type per crate, exhaustive match on conversion to HTTP. Easier to audit than `anyhow` strings.
- **tokio 1.x.** The default. Stable, fast, well-understood.
- **`SQLX_OFFLINE` builds.** CI doesn't need a database; the `.sqlx/` directory ships compile-time query metadata.

## What to tune

- Swap rustls for native-tls if your TLS cert chain is the OS-managed one (`runtime-tokio-native-tls`).
- Drop `cargo-watch` if you don't want a global install; `bacon` is a richer alternative.
- For multi-region deployments, swap a connection pool per region in `AppState`. Don't try to make sqlx region-aware.

## Verification

`verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
