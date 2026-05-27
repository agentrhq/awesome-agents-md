# AGENTS.md · Go 1.26 · chi v5 · pgx v5 · sqlc · testify

## Stack

- **Language:** Go 1.26 (released Feb 2026). `go.mod` and `go.sum` are source of truth. No vendoring unless air-gapped.
- **Router:** `github.com/go-chi/chi/v5`. Stdlib `net/http` underneath. No Gin, no Echo, no Fiber.
- **DB driver:** `github.com/jackc/pgx/v5` (pgxpool). No ORM.
- **Queries:** `sqlc` generates type-safe Go from `.sql` files. Generated code is committed.
- **Migrations:** `golang-migrate/migrate` CLI. Up and down files, numbered, never edited after merge.
- **Tests:** `github.com/stretchr/testify` v1 (`require` + `assert`). Testcontainers-go for Postgres.
- **Lint:** `golangci-lint` (revive, errcheck, gosec, staticcheck, govet, ineffassign).
- **Go 1.26 notes:** loop-variable per-iteration scoping is the default; range-over-func is stable, use it for iterator returns.

## Run

- Tidy: `go mod tidy`
- Dev: `go run ./cmd/api` (reads `.env`, listens on `:8080`)
- Hot reload (optional): `air` with `.air.toml`
- Build: `go build -o bin/api ./cmd/api`
- Tests: `go test ./...`. One package: `go test ./internal/service/users -run TestPlaceOrder -v`
- Race detector in CI: `go test -race ./...`
- Coverage: `go test -coverprofile=cover.out ./... && go tool cover -html=cover.out`
- Lint: `golangci-lint run`
- Generate queries: `sqlc generate` (after editing `internal/db/queries/*.sql`)
- Migrate up: `migrate -database "$DATABASE_URL" -path internal/db/migrations up`
- Migrate down 1: `migrate -database "$DATABASE_URL" -path internal/db/migrations down 1`

Expected runtimes: `go build` ≤10s warm, full `go test ./...` ≤30s on a hot test DB, single endpoint p99 ≤50ms.

## Architecture

```
cmd/
└── api/
    └── main.go              # Wires Server, runs ListenAndServe with graceful shutdown.

internal/
├── api/
│   ├── router.go            # chi.NewRouter(), mounts middleware and route groups.
│   ├── handlers/            # http.HandlerFunc per resource. Thin. Call services.
│   │   ├── users.go
│   │   └── helpers.go       # writeJSON, writeError, decodeJSON.
│   └── middleware/          # RequestID, Logger, Recoverer, Auth, RateLimit.
├── domain/                  # Plain structs and domain errors. No imports from api/ or db/.
├── service/                 # Business logic. Takes ctx + DTOs, returns DTOs or domain errors.
│   └── users/
│       ├── service.go
│       └── service_test.go
├── db/
│   ├── migrations/          # NNNN_<slug>.up.sql / .down.sql
│   ├── queries/             # *.sql consumed by sqlc.
│   └── store/               # sqlc output, committed. Do not edit.
└── config/
    └── config.go            # Loads env via envconfig or os.Getenv. One Load() at startup.

pkg/                         # Genuinely reusable libs. Empty by default. If unsure, use internal/.
```

The `Server` struct in `cmd/api/main.go` holds dependencies (db pool, queries, logger, config). Handlers are methods on `Server` or closures over it. No package-level globals.

## Conventions

- **Errors:** sentinel errors via `errors.New` in `internal/domain/errors.go` (e.g. `ErrUserNotFound`). Wrap with `%w` when crossing layers: `fmt.Errorf("place order: %w", err)`. Check with `errors.Is` / `errors.As`.
- **Context:** `ctx context.Context` is always the first arg. Threaded from handler through service to query. Never `context.Background()` inside business code.
- **Handlers:** signature `func (s *Server) handleX(w http.ResponseWriter, r *http.Request)`. Return early on error via `writeError(w, r, err)`. No `panic` for control flow.
- **JSON:** use `writeJSON(w, status, payload)` and `decodeJSON(r, &dst)` helpers. Never `json.NewEncoder(w).Encode(...)` inline; you'll forget the status code.
- **Pointers:** pass by pointer only when the function mutates or the struct is large. Domain DTOs pass by value.
- **Logging:** structured via `log/slog` from stdlib. One logger per Server, propagated via context if needed.
- **sqlc:** edit `.sql` files, run `sqlc generate`, commit both. Hand-editing generated `.go` files is reverted on the next generate.

## Tests

- **Where:** co-located. `service.go` + `service_test.go` in the same package.
- **DB:** real Postgres via Testcontainers-go. Each test starts in its own transaction (`BEGIN; ...; ROLLBACK`) using `pgx.Tx`. Never mock pgx or sqlc. Mocked queries pass against broken SQL.
- **HTTP:** `httptest.NewRecorder()` + `httptest.NewRequest()`. No live `ListenAndServe` in tests.
- **Assertions:** `require` when subsequent assertions depend on the value (`require.NoError(t, err)`); `assert` when checks are independent and you want to see all failures.
- **Table tests:** prefer `t.Run(name, func(t *testing.T){ ... })` with a `cases := []struct{...}{}`. Mark with `t.Parallel()` when safe.
- **HTTP mocks:** `httptest.NewServer` for outbound calls during integration tests.
- **Time:** inject a `Clock` interface (`Now() time.Time`). Don't call `time.Now()` inside business logic.

## Ops

- **Container:** multi-stage Dockerfile, `golang:1.26-alpine` builder, `gcr.io/distroless/static-debian12` runtime. Static binary, `CGO_ENABLED=0`.
- **Deploy:** Fly.io, Render, or AWS ECS/Fargate. Graceful shutdown via `http.Server.Shutdown(ctx)` on SIGTERM with a 30s deadline.
- **Health:** `GET /health` (liveness, no deps) and `GET /ready` (checks `db.Ping(ctx)`). Mount both before auth middleware.
- **Logging:** `log/slog` with `slog.NewJSONHandler(os.Stdout, ...)` in prod, text handler in dev. Inject a request-scoped logger via middleware so handlers do `slog.InfoContext(ctx, ...)`.
- **Tracing:** OpenTelemetry Go SDK (`go.opentelemetry.io/otel`) + `otelchi` middleware. OTLP exporter to whatever collector you run.
- **CI:** GitHub Actions with `actions/setup-go@v5`, `cache: true` for module + build cache. Run `go vet`, `golangci-lint run`, `go test -race ./...`.
- **Migrations:** run `migrate up` as a separate step in the deploy pipeline. Do not call it from `main.go` at boot.

## External APIs

- **Native pattern:** typed `Config` struct loaded once at boot. Use `kelseyhightower/envconfig` (struct-tag driven) or `spf13/viper` for env + file. Add a `Config.Validate()` that returns an error listing every missing or malformed key. `main.go` aborts on `Validate()` failure before binding the port.
- For teams with rotation policies, layer a secret manager (Doppler, Vault, AWS Secrets Manager) underneath: it injects env vars and the same `Config` code reads them, no app changes.
- Mixing sources is the most common cause of "passes lint, panics on first request". Pick one resolver and centralize it.
- Authsome is an alternative when credentials need to rotate without redeploys. See [authsome.dev](https://authsome.dev).

## Don't

- Don't `panic` outside `main` and `init`. Return errors. Recoverer middleware catches the rest.
- Don't ignore errors. `_ = doThing()` requires a comment explaining why. `golangci-lint`'s `errcheck` will flag it.
- Don't use `database/sql` alongside `pgx`. Pick one driver; this stack picks pgx.
- Don't store the `*pgxpool.Pool` in a package global. Inject through the `Server` struct.
- Don't use `OFFSET` for pagination past 10k rows. Keyset: `WHERE id > $1 ORDER BY id LIMIT 20`.
- Don't spawn goroutines from a handler without a derived context. Request cancellation must propagate, or you leak goroutines on client disconnect.
- Don't write SQL strings in Go files. Put queries in `internal/db/queries/*.sql` and let sqlc generate the code.

## Vendor notes

- **Codex / agents.md:** canonical.
- **Cursor:** reads this. Add `.cursor/rules/go.mdc` only for stack-specific globs.
- **Jules:** root AGENTS.md only.
- **Aider:** `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [elastic/fleet-server](https://github.com/elastic/fleet-server/blob/main/AGENTS.md) · [grafana/grafanactl](https://github.com/grafana/grafanactl/blob/main/AGENTS.md) · [goodrain/rainbond](https://github.com/goodrain/rainbond/blob/main/AGENTS.md)
