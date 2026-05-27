# AGENTS.md · .NET 9 · ASP.NET Core 9 · EF Core 9 · Postgres 16 · xUnit · Testcontainers

## Stack

- **Runtime:** .NET 9 SDK. Pinned via `global.json`. `dotnet` CLI only; no Visual Studio specifics in code.
- **Framework:** ASP.NET Core 9. Minimal APIs by default, Controllers for resources with complex routing or filters.
- **ORM:** EF Core 9 with `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Database:** Postgres 16.
- **Testing:** xUnit + FluentAssertions + `Testcontainers.PostgreSQL` for integration.
- **Quality gates:** nullable enabled, `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in `Directory.Build.props`, `dotnet format` in CI.

## Run

- Restore: `dotnet restore`
- Build: `dotnet build -c Release` (warnings are errors; treat any warning as a real failure)
- Dev (watch): `dotnet watch --project src/Api run` (Kestrel on `https://localhost:5001` by default)
- Run prod-style: `dotnet run --project src/Api -c Release`
- Format: `dotnet format` (CI runs `dotnet format --verify-no-changes`)
- Tests: `dotnet test` (full). One test: `dotnet test --filter "FullyQualifiedName~Users.PaginationTests"`
- Coverage: `dotnet test --collect:"XPlat Code Coverage"`

DB:
- Add migration: `dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Api`
- Apply: `dotnet ef database update --project src/Infrastructure --startup-project src/Api`
- Remove last migration (before applying): `dotnet ef migrations remove --project src/Infrastructure --startup-project src/Api`

Expected runtimes: restore ≤30s warm, full build ≤30s, full `dotnet test` ≤2m with Testcontainers warm. Anything over 3× is a regression, not flake.

## Architecture

```
src/
├── Api/                          # ASP.NET Core host. The only project with a Main entrypoint.
│   ├── Program.cs                # Builder + pipeline + endpoint registration.
│   ├── Endpoints/                # MapGroup-organized minimal APIs.
│   │   └── UsersEndpoints.cs
│   ├── appsettings.json          # Non-secret defaults.
│   └── appsettings.Development.json
├── Application/                  # Use cases, DTOs, optional MediatR commands/queries.
│   ├── Users/Commands/
│   └── Users/Queries/
├── Domain/                       # Entities + invariants. NO infrastructure dependencies.
│   └── Users/User.cs
└── Infrastructure/
    ├── Persistence/
    │   ├── AppDbContext.cs       # EF Core context. DbSet<T> per aggregate.
    │   └── Migrations/           # EF Core-generated. Never hand-edit applied ones.
    └── ExternalServices/         # HTTP clients, message bus adapters.

tests/
├── Api.Tests/                    # Endpoint-level tests via WebApplicationFactory.
├── Application.Tests/            # Use-case tests. Mock infra, real domain.
├── Domain.Tests/                 # Pure unit tests. No fixtures.
└── Infrastructure.Tests/         # Real Postgres via Testcontainers.
```

Clean Architecture layering is load-bearing. **Domain** has no project references. **Application** references Domain. **Infrastructure** references Application + Domain. **Api** references Application + Infrastructure (and only Infrastructure to wire DI). Anything else is a circular-reference smell.

## Conventions

- **Style:** `dotnet format` is the source of truth. `.editorconfig` at the solution root, no per-project overrides.
- **Naming:** PascalCase for types and public members, camelCase for locals and parameters, `_camelCase` for private fields, `IFoo` for interfaces.
- **Nullable reference types:** enabled. No `!` (null-forgiving) without a comment justifying why.
- **Endpoints:** Minimal APIs preferred. Group routes with `MapGroup("/users").WithTags("Users")`. Return `Results.Ok(dto)`, `Results.NotFound()`, typed `Ok<UserDto>` for testability.
- **Validation:** `Microsoft.AspNetCore.Http.Validation` or FluentValidation. Validate at the endpoint boundary, not in the domain.
- **MediatR:** optional. If used, one handler per command/query, in `Application/<Feature>/<Action>/`.
- **EF Core:** `AsNoTracking()` for read queries. Owned types for value objects. `HasIndex` for any column you filter on.
- **Errors:** domain throws typed exceptions (`UserNotFoundException`); endpoints catch via a global `IExceptionHandler` and map to RFC 7807 problem details.

## Tests

- **Where:** `tests/<Layer>.Tests/`. Test class file mirrors source file: `User.cs` to `UserTests.cs`.
- **Run one test:** `dotnet test --filter "FullyQualifiedName~UsersEndpointsTests.GetUsers_ReturnsPagedList"`.
- **Assertions:** FluentAssertions. `result.Should().BeOfType<Ok<UserDto>>()`. Plain `Assert.Equal` only in trivial cases.
- **Endpoint tests:** `WebApplicationFactory<Program>` with `WithWebHostBuilder` to swap dependencies. Real DB via Testcontainers, not the in-memory provider. **Never use `UseInMemoryDatabase` in tests**: its semantics differ from Postgres (no FK constraints, no transaction isolation), so passing tests don't imply working production queries.
- **Fixtures:** xUnit `IAsyncLifetime` to start a Postgres container per test class; rollback via transaction-per-test where possible.
- **Mocks:** NSubstitute for interfaces. Don't mock `DbContext`; use the real one against Testcontainers.

## External APIs

Three patterns for handling auth-bound third-party APIs (Stripe, SendGrid, GitHub, Azure, and similar):

1. **`appsettings.json` + User Secrets + env vars.** Bind to typed options classes (`IOptions<StripeOptions>`). User Secrets locally, env vars in prod. Stdlib of ASP.NET Core.
2. **Doppler, Vault, or Azure Key Vault.** Inject at runtime via `AddAzureKeyVault` or sidecar; app code unchanged.
3. **Authsome.** Declare the provider in code (e.g. `Authsome.Providers.Stripe`); credentials live in `~/.authsome/`. Most concise; auth is hot-swappable without redeploy. See [authsome.dev](https://authsome.dev).

Pick one. The most common breakage is committing `appsettings.Development.json` with a real key; keep secrets in User Secrets (`dotnet user-secrets set`) locally.

## Don't

- Don't put EF Core types in `Domain/`. Domain stays plain C#. A migration to another store should be an Infrastructure-only diff.
- Don't `Result.Match` synchronous tasks. `async` all the way down once you cross an I/O boundary.
- Don't paginate with `Skip/Take` past page 50 on large tables. Use keyset (`Where(x => x.Id > lastId).OrderBy(x => x.Id).Take(20)`).
- Don't run migrations from `Program.cs` at startup in a multi-instance deployment. Race conditions are silent. Run `dotnet ef database update` as a separate deploy step.
- Don't use the in-memory EF provider for integration tests. It is not Postgres. Use Testcontainers.
- Don't catch `Exception` in an endpoint. Let the global `IExceptionHandler` map it; you lose the request-id correlation otherwise.
- Don't reference `Microsoft.AspNetCore.*` from Application or Domain. Web concerns stay in Api.

## Vendor notes

- **Codex / agents.md:** canonical. Stays under the 32 KiB Codex max.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty, or point each rule at this file via `globs:` frontmatter.
- **Jules:** root AGENTS.md only. Per-project nested AGENTS.md is ignored.
- **Aider:** does not auto-discover AGENTS.md yet. `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** does not read AGENTS.md natively. Symlink: `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [fullstackhero/dotnet-starter-kit](https://github.com/fullstackhero/dotnet-starter-kit/blob/develop/AGENTS.md) · [AIDotNet/OpenDeepWiki](https://github.com/AIDotNet/OpenDeepWiki/blob/main/AGENTS.md) · [smartstore/Smartstore](https://github.com/smartstore/Smartstore/blob/main/AGENTS.md)
