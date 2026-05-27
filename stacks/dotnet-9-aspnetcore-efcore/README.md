---
stack_slug: dotnet-9-aspnetcore-efcore
display_name: .NET 9 · ASP.NET Core 9 · EF Core 9 · Postgres 16 · xUnit · Testcontainers
components: [dotnet-9, aspnetcore-9, efcore-9, postgres-16, xunit, testcontainers-postgresql]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# .NET 9 + ASP.NET Core + EF Core + Postgres + xUnit

A Clean Architecture .NET 9 service: Minimal APIs in front, EF Core 9 against Postgres in back, xUnit + FluentAssertions + Testcontainers for the test pyramid.

## Why these choices

- **.NET 9 + Minimal APIs.** Minimal APIs are the default for new services. Controllers stay for endpoints with complex filter/binding needs.
- **EF Core 9 with Npgsql.** First-party, mature, Postgres-native (jsonb, arrays, materialized views). Migrations as code.
- **Clean Architecture (Domain/Application/Infrastructure/Api).** Compile-time enforcement of dependency direction; swapping infra is a project-reference change, not a rewrite.
- **xUnit + FluentAssertions + Testcontainers.** xUnit is the de facto standard; FluentAssertions reads like prose; Testcontainers means tests exercise real Postgres SQL.
- **Warnings-as-errors + nullable enabled.** Catches null bugs at compile time; the tax is paid once.

## What to tune

- Drop `Application/` and fold its contents into `Api/` if the service is small and unlikely to grow.
- Skip MediatR unless you actually want pipeline behaviors (logging, validation, transactions). For CRUD, it's overhead.
- Swap `Testcontainers.PostgreSQL` for `Respawn` against a shared CI database if container start time dominates test runtime.

## Verification

`verified_with` is empty until a maintainer runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the run logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). The three production references all ship AGENTS.md files combining ASP.NET Core, EF Core, and Postgres at scale, so the conventions here are well grounded; a PR confirming agent behavior across the four vendors is welcome.
