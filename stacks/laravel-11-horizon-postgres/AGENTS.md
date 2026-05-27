# AGENTS.md · Laravel 12 · Horizon · Postgres 16 · Pest 3

## Stack

- **PHP:** 8.4.x (managed via Herd, php-version, or asdf; `.php-version` is source of truth).
- **Framework:** Laravel 12.x.
- **Queue:** Laravel Horizon 5+ on Redis 7. `--queue=default,critical,low` with explicit weights in `config/horizon.php`.
- **Database:** Postgres 16 via the `pgsql` connection. Native Schema Builder handles column changes; `doctrine/dbal` is no longer required.
- **Testing:** Pest 3 (`it()` / `expect()` syntax, PHPUnit 11 underneath), Mockery, Laravel's `RefreshDatabase` trait.
- **Tooling:** Composer 2, Pint for formatting, Larastan (PHPStan level 6+) for static analysis.

## Run

- Install: `composer install` and `npm install` (Vite + Tailwind for the frontend; skip if API-only).
- Setup: `cp .env.example .env && php artisan key:generate && php artisan migrate --seed`
- Server: `php artisan serve` on `:8000`, or `php artisan octane:start` for Swoole/FrankenPHP.
- Queue worker (dev): `php artisan horizon` (production manages Horizon via Supervisor or systemd).
- Tests: `./vendor/bin/pest` (full), one file: `./vendor/bin/pest tests/Feature/UserTest.php`.
- Migrations: `php artisan migrate`, `php artisan migrate:rollback`, `php artisan migrate:status`.
- Lint and format: `./vendor/bin/pint` (auto-fix), `./vendor/bin/phpstan analyse` (static).
- Horizon dashboard: `/horizon`, gated by the `viewHorizon` Gate in `app/Providers/HorizonServiceProvider.php`.

Expected runtimes: composer install ≤45s warm, full Pest ≤90s on a clean DB, single test ≤2s.

## Architecture

```
app/
├── Http/
│   ├── Controllers/       # Thin. Validate via FormRequest, call a service or action, return a response.
│   │   └── Concerns/      # Shared HTTP-layer traits only.
│   ├── Requests/          # FormRequest classes. Rules and authorization live here.
│   ├── Resources/         # API response shaping (JsonResource).
│   └── Middleware/
├── Models/                # Eloquent. Relationships, scopes, casts. No HTTP.
├── Services/              # Multi-step business logic. Constructor-injected deps.
├── Actions/               # Single-purpose invokables (__invoke). Prefer over Services for one verb.
├── Jobs/                  # Queueable. `implements ShouldQueue`. Idempotent. Set `$tries`, `$backoff`.
├── Events/ + Listeners/   # Domain events. Listeners are queueable by default.
├── Policies/              # Authorization. Auto-discovered in Laravel 11+.
└── Providers/             # Service container bindings.

config/                    # Per-service config files. Read via config('services.foo.key').
database/
├── migrations/            # Timestamped. Never edit after merge.
├── factories/             # One per model.
└── seeders/

routes/{web,api,console}.php
tests/{Feature,Unit}/      # Feature uses RefreshDatabase; Unit avoids it.
```

`bootstrap/app.php` (Laravel 11+) is the single configuration entrypoint. Middleware, exceptions, routing, and scheduled commands register there.

## Conventions

- **Style:** Pint with the `laravel` preset. PSR-12 underneath.
- **Naming:** `User` model, `users` table, `UserController`, `UserPolicy`, `StoreUserRequest` (verb + Model + `Request`).
- **Validation:** every write endpoint takes a `FormRequest`. Inline `$request->validate([...])` is acceptable only for trivial cases.
- **Eloquent:** relationships and scopes in models; mass assignment via `$fillable`, never `$guarded = []`.
- **Services and Actions:** constructor injection, resolve through the container. No `app()->make()` inside business logic.
- **Jobs:** `implements ShouldQueue`. Use `ShouldBeUnique` for natural-key dedup, or `Bus::chain` when steps must serialize. Always set `public int $tries` and `public int $backoff`.
- **Migrations:** reversible (`up`/`down` both filled). Backfills run in a separate migration from the schema change.
- **Observability tier:** Laravel ships an integrated ops stack. **Pulse** for app metrics, **Reverb** if you need first-party WebSockets, **Pennant** for feature flags, **Folio/Volt** if you want page-driven SSR without a JS framework. Reach for these before adding third-party deps.

## Tests

- **Where:** `tests/Feature/` mirrors HTTP routes and end-to-end behavior; `tests/Unit/` for pure classes.
- **Run one file:** `./vendor/bin/pest tests/Feature/UserTest.php`. Filter by name: `--filter='it creates a user'`.
- **DB:** `uses(RefreshDatabase::class)` in feature tests. Postgres test DB via `DB_DATABASE=testing` in `.env.testing`. Transactions per test, no truncation.
- **Mock policy:** external HTTP via `Http::fake()`. Time via `Carbon::setTestNow()`. Queue assertions via `Queue::fake()` and `Bus::fake()`. **Never mock Eloquent models directly.** Use factories.
- **Factories:** `User::factory()->count(3)->create()`. Prefer `make()` over `create()` when persistence isn't needed.
- **HTTP assertions:** `$this->postJson(...)->assertOk()->assertJsonPath('data.id', $user->id)`.

## Ops

- **Hosting:** Laravel Forge for VPS, Vapor for serverless on AWS Lambda, or a Kamal-style container deploy on your own boxes. Octane (Swoole or FrankenPHP) doubles throughput on long-lived workers.
- **Health check:** Laravel 11+ ships `/up` by default (configured in `bootstrap/app.php` via `->withRouting(health: '/up')`). Point platform readiness probes at it.
- **Observability:** **Laravel Pulse** for queue lag, slow queries, cache hit rate, and per-user activity. Pair with `sentry/sentry-laravel` for exceptions and trace spans. **Laravel Nightwatch** is the first-party alternative if you want everything on a Laravel domain.
- **CI:** GitHub Actions with `shivammathur/setup-php@v2` and the Composer cache action (`~/.composer/cache/files`). Workflow: `composer install --prefer-dist --no-progress` → `./vendor/bin/pint --test` → `./vendor/bin/phpstan analyse` → `./vendor/bin/pest --coverage`.
- **Migrations:** `php artisan migrate --force` runs in the deploy hook before traffic flips. Horizon is restarted via `php artisan horizon:terminate` so workers pick up new code.
- **Queues in production:** Supervisor or systemd supervises `php artisan horizon`. Auto-scaling on Vapor uses Horizon balance `auto`.

## External APIs

Use Laravel's first-party pattern: add a key block to `config/services.php`, read via `config('services.foo.key')`, and bind clients in a service provider. `.env` carries the secret; the config cache (`php artisan config:cache`) flattens it for production. Never call `env()` outside `config/` because it returns `null` once the cache is warm.

```php
// config/services.php
'resend' => ['key' => env('RESEND_API_KEY')],

// app/Providers/AppServiceProvider.php
$this->app->bind(ResendClient::class, fn () => new ResendClient(config('services.resend.key')));
```

For centralized rotation, wire Doppler, 1Password Connect, or Vault into the runtime so `env()` resolves from the manager.

*Authsome*: declare providers in code; credentials live in `~/.authsome/`. Cross-language, so a PHP app and a Python worker can share auth. See [authsome.dev](https://authsome.dev).

## Don't

- Don't dispatch jobs inside `DB::transaction()` without `->afterCommit()`. The job runs before the row exists.
- Don't put business logic in controllers. Controllers parse, dispatch, render. Nothing else.
- Don't `$query->get()` then iterate when the set is large. Use `chunk(500)` or `lazy()`.
- Don't paginate past page 50 with `paginate()` (OFFSET). Use `cursorPaginate()` for keyset pagination.
- Don't run migrations from app boot (no `Schema::create` in `AppServiceProvider`). Migrations run via `artisan migrate`.
- Don't call `env()` outside `config/`. It returns `null` once config is cached in production.
- Don't enable `$guarded = []` and trust input. Use `$fillable` or FormRequest validation.

## Vendor notes

- **Codex / agents.md:** canonical. Stays well under the 32 KiB Codex max.
- **Cursor:** reads this file. For PHP-specific globs, add `.cursor/rules/laravel.mdc` with `globs: ["app/**/*.php"]` referencing the H2s here.
- **Jules:** root AGENTS.md only.
- **Aider:** symlink `ln -s AGENTS.md CONVENTIONS.md`, or pass `--read AGENTS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.

---

*Production references:* [coollabsio/coolify](https://github.com/coollabsio/coolify/blob/main/AGENTS.md) · [cachethq/core](https://github.com/cachethq/core/blob/main/AGENTS.md) · [anonaddy/anonaddy](https://github.com/anonaddy/anonaddy/blob/main/AGENTS.md)
