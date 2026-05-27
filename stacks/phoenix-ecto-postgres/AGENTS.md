# AGENTS.md · Elixir 1.18 · Phoenix 1.7 · Ecto 3 · Postgres 16 · Oban · ExUnit

## Stack

- **Language:** Elixir 1.18 on Erlang/OTP 27 or 28. `.tool-versions` pins both (asdf or mise).
- **Framework:** Phoenix 1.7.x (LiveView 1.0+, function components, verified routes).
- **ORM:** Ecto 3.x with `postgrex`. One Repo per app.
- **Database:** Postgres 16.
- **Background jobs:** Oban (Postgres-backed). No Sidekiq, no separate Redis.
- **Tests:** ExUnit, with `Ecto.Adapters.SQL.Sandbox` for DB isolation.
- **Lint/format:** `mix format` (CI-enforced via `mix format --check-formatted`), `mix credo --strict` (CI-blocking).
- **Static analysis:** `mix dialyzer` (via `dialyxir`). Optional on PR, required on main.

## Run

- Install: `mix deps.get && mix deps.compile`
- Setup DB: `mix ecto.setup` (creates, migrates, seeds)
- Dev server: `mix phx.server` (port 4000) or `iex -S mix phx.server` for a live shell
- Tests (all): `mix test`
- Tests (one file): `mix test test/my_app/accounts_test.exs`
- Tests (one line): `mix test test/my_app/accounts_test.exs:42`
- Format: `mix format`
- Lint: `mix credo --strict`
- Typespecs: `mix dialyzer`

DB:
- New migration: `mix ecto.gen.migration <slug>` (creates `priv/repo/migrations/<ts>_<slug>.exs`)
- Apply: `mix ecto.migrate`
- Rollback one: `mix ecto.rollback`
- Reset: `mix ecto.reset` (drops, creates, migrates, seeds)

Expected runtimes: `mix deps.compile` ≤90s cold, `mix test` ≤30s on a hot test DB, `mix phx.server` boot ≤3s. Dialyzer's first PLT build is slow (5+ min); cache it in CI.

## Architecture

```
lib/
├── my_app/                      # Domain. No Phoenix imports here.
│   ├── application.ex           # Supervision tree. Repo, Oban, PubSub, Endpoint.
│   ├── repo.ex
│   ├── release.ex               # Release tasks: MyApp.Release.migrate/0, rollback/2.
│   ├── accounts.ex              # Context module. Public API for the bounded context.
│   ├── accounts/
│   │   ├── user.ex              # Ecto schema + changesets.
│   │   └── session.ex
│   ├── billing.ex               # Another context. Never imports Accounts.User directly.
│   ├── billing/
│   │   └── invoice.ex
│   └── workers/
│       └── send_email_worker.ex # Oban worker. use Oban.Worker, queue: :mailers.
└── my_app_web/                  # HTTP layer. Imports my_app contexts only.
    ├── endpoint.ex
    ├── router.ex                # Verified routes (~p"/users/#{id}").
    ├── controllers/
    │   └── user_controller.ex
    ├── live/                    # LiveView modules. Mirror controllers/ by feature.
    │   └── user_live/
    ├── components/              # Function components. core_components.ex is generated.
    └── telemetry.ex

priv/
└── repo/
    ├── migrations/              # Timestamped. Never edit after merge.
    └── seeds.exs

test/
├── support/                     # DataCase, ConnCase, factory helpers.
├── my_app/                      # Mirror lib/my_app/. accounts_test.exs, etc.
└── my_app_web/                  # Mirror lib/my_app_web/. controllers, live, etc.
```

**Contexts are the seam.** `MyAppWeb` calls `MyApp.Accounts.list_users/1`. It does not call `MyApp.Repo.all/1` or `MyApp.Accounts.User |> ...`. Contexts encapsulate Repo access.

## Conventions

- **Module naming:** PascalCase, mirror the file path. `lib/my_app/accounts/user.ex` → `MyApp.Accounts.User`.
- **Context boundary:** never reach into another context's Repo or schemas. If `Billing` needs a user, expose `Accounts.get_user/1` and call it.
- **Changesets:** every write goes through a changeset. Validate there, not in the controller.
- **LiveView vs controller:** LiveView for interactive UI (`mount`, `handle_event`); controllers for JSON APIs and static pages.
- **Pattern matching over conditionals.** `case`, `with`, and function clauses beat nested `if`.
- **Verified routes:** use `~p"/users/#{user}"` everywhere. Bare strings rot.
- **Pipes:** one transformation per line. If a pipeline needs intermediate names, break it into a `with` block.
- **Oban workers:** declare `unique: [period: 60]` (or appropriate) when the job must be idempotent on duplicate enqueue.

## Tests

- **Where:** mirror `lib/my_app/accounts.ex` with `test/my_app/accounts_test.exs`. Phoenix follows the convention `<module_name>_test.exs`.
- **DB:** `use MyApp.DataCase` for context tests (sandbox checkout, rollback per test). `use MyAppWeb.ConnCase` for controller and LiveView tests.
- **Async:** `use MyApp.DataCase, async: true`. The SQL sandbox supports concurrent tests; default to async unless a test touches global state (Application env, ETS singletons).
- **Factories:** `ExMachina` or a hand-rolled `Factories` module under `test/support/`. Don't seed via the Repo directly in each test.
- **No `Process.sleep`.** Use `assert_receive` for messages, `Phoenix.LiveViewTest.render_async/1` for LiveView, `Oban.Testing.assert_enqueued/1` for jobs.
- **Oban:** `use Oban.Testing, repo: MyApp.Repo`. Inline mode (`testing: :inline`) for unit tests; manual mode (`testing: :manual`) plus `Oban.drain_queue/2` for integration.
- **External HTTP:** mock via `Mox` (define behaviours, expect in tests) or `bypass` (real local HTTP server).

## Ops

- **Releases:** `mix release` for production builds. Output goes under `_build/prod/rel/my_app/`. Run with `bin/my_app start` (or `daemon` / `start_iex`). Never deploy via `mix phx.server`.
- **Deploy targets:** Fly.io is the native Phoenix path (the generator scaffolds the Dockerfile + `fly.toml`). Gigalixir, Render, and self-hosted Kubernetes all work with the same release tarball.
- **Migrations:** call `MyApp.Release.migrate/0` from a pre-start hook (Fly: `release_command`). The release does not have `mix` available. Define `migrate/0` to call `Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))`.
- **Observability:** Phoenix LiveDashboard at `/dashboard` covers BEAM metrics, Ecto, Oban, and Telemetry events without extra config. Pair with `:telemetry_metrics_prometheus_core` for a scrape endpoint.
- **Health:** `GET /health` for liveness, `GET /live` works through LiveDashboard if you enable it. Mount both before auth plugs.
- **CI:** GitHub Actions with `erlef/setup-beam@v1` pinned to your `.tool-versions`. Cache `_build/` and `deps/` keyed on `mix.lock`. Cache the dialyzer PLT separately.
- **Hot upgrades:** the BEAM supports them; most teams don't use them. Plan for blue/green or rolling restarts instead.

## External APIs

- **Native pattern:** `config/runtime.exs` reads via `System.fetch_env!/1` for required keys and `System.get_env/2` for optional ones with defaults. `fetch_env!` raises with the missing variable name, so boot fails loudly on the offending host.
- For teams with rotation policies, layer a secret manager (Doppler, Vault, Infisical) underneath. It injects env vars and `runtime.exs` reads them.
- Splitting secrets between `runtime.exs` and an external manager makes "why is staging different" investigations long. Pick one resolver.
- Authsome is an alternative when credentials need to rotate without redeploys. See [authsome.dev](https://authsome.dev).

## Don't

- Don't call `Repo` functions from `MyAppWeb`. Route through a context. The compiler won't stop you; reviewers should.
- Don't run migrations from inside `Application.start/2`. Multi-node race conditions are silent. Use a release task (`MyApp.Release.migrate/0`) invoked before boot.
- Don't `Process.sleep` in tests. It's a flake factory. Use `assert_receive`, `eventually`, or `Phoenix.LiveViewTest.render_async`.
- Don't put business logic in changesets. Changesets validate; contexts decide. A changeset returning `{:ok, %User{}}` should not have charged a credit card.
- Don't use `Ecto.Multi` and then ignore its result tuple. Pattern-match on `{:ok, _}` / `{:error, failed_op, failed_value, _changes_so_far}`.
- Don't broadcast from inside a transaction. The subscriber may receive the event before the transaction commits.
- Don't paginate with `OFFSET` past a few thousand rows. Use keyset pagination via `Ecto.Query.from(... where: q.id > ^cursor)`.

## Vendor notes

- **Codex / agents.md:** canonical. Well under the 32 KiB cap.
- **Cursor:** reads this file. Pair with `.cursor/rules/elixir.mdc` for IDE-specific globs.
- **Jules:** root AGENTS.md only.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [tuist/tuist](https://github.com/tuist/tuist/blob/main/server/AGENTS.md) · [getsentry/sentry-elixir](https://github.com/getsentry/sentry-elixir/blob/master/AGENTS.md) · [semaphoreio/semaphore](https://github.com/semaphoreio/semaphore/blob/main/zebra/AGENTS.md)
