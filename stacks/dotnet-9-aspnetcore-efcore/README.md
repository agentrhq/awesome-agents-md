---
stack_slug: dotnet-9-aspnetcore-efcore
display_name: .NET 10 LTS · ASP.NET Core 10 · EF Core 10 · Postgres 16 · xUnit v3 · Testcontainers
components: [dotnet-10, aspnetcore-10, efcore-10, postgres-16, xunit-v3, testcontainers-postgresql, aspire]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# .NET 10 + ASP.NET Core + EF Core + Postgres + xUnit + Aspire

A Clean Architecture .NET 10 LTS service: Minimal APIs in front, EF Core 10 against Postgres in back, xUnit v3 + FluentAssertions + Testcontainers for the test pyramid, .NET Aspire for orchestration.

## Why these choices

- **.NET 10 LTS + Minimal APIs.** .NET 10 is the current long-term-support release (Nov 2025). Minimal APIs are the default for new services; controllers stay for endpoints with complex filter/binding needs.
- **EF Core 10 with Npgsql.** First-party, mature, Postgres-native (jsonb, arrays, materialized views). Migrations as code.
- **Clean Architecture (Domain/Application/Infrastructure/Api).** Compile-time enforcement of dependency direction; swapping infra is a project-reference change, not a rewrite.
- **.NET Aspire for orchestration.** Local-dev parity with the prod topology (DB, cache, sidecars). Generates deploy manifests for Azure Container Apps and Kubernetes.
- **xUnit v3 + FluentAssertions + Testcontainers.** xUnit v3 is the current line; FluentAssertions reads like prose; Testcontainers means tests exercise real Postgres SQL.
- **Built-in OpenAPI + Scalar.** .NET 10 ships `Microsoft.AspNetCore.OpenApi`; Scalar replaces Swashbuckle as the default docs UI.
- **Warnings-as-errors + nullable enabled.** Catches null bugs at compile time; the tax is paid once.

## What to tune

- Drop `Application/` and fold its contents into `Api/` if the service is small and unlikely to grow.
- Skip MediatR unless you actually want pipeline behaviors (logging, validation, transactions). For CRUD, it's overhead.
- Swap `Testcontainers.PostgreSQL` for `Respawn` against a shared CI database if container start time dominates test runtime.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). The three production references all ship AGENTS.md files for .NET 10 + EF Core + Postgres (fullstackhero adds Aspire; SSW.CleanArchitecture is the canonical Clean Architecture template; Smartstore is a large e-commerce platform), so the conventions here are well grounded. Send a PR if you've confirmed them across the four agents.
