# AGENTS.md · Laravel 11 · Horizon · Postgres 16 · Pest 3

## Stack

- **PHP:** 8.3.x (managed via Herd, php-version, or asdf; `.php-version` is source of truth).
- **Framework:** Laravel 11.x.
- **Queue:** Laravel Horizon on Redis 7. `--queue=default,critical,low` with explicit weights in `config/horizon.php`.
- **Database:** Postgres 16 via the `pgsql` connection. Schema introspection through `doctrine/dbal` (required by Laravel for column changes).
- **Testing:** Pest 3 (`it()` / `expect()` syntax, PHPUnit 11 underneath), Mockery, Laravel's `RefreshDatabase` trait.
- **Tooling:** Composer 2, Pint for formatting, Larastan (PHPStan level 6+) for static analysis.

## Run

- Install: `composer install` and `npm install` (Vite + Tailwind for the frontend; skip if API-only).
- Setup: `cp .env.example .env && php artisan key:generate && php artisan migrate --seed`
- Server: `php artisan serve` on `:8000`, or `php artisan octane:start` for Swoole/RoadRunner.
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
│   ├── Requests/          # FormRequest classes. Rules and authorization live here, not in controllers.
│   ├── Resources/         # API response shaping (JsonResource).
│   └── Middleware/
├── Models/                # Eloquent. Relationships, scopes, casts. No HTTP, no controllers.
├── Services/              # Multi-step business logic. Constructor-injected dependencies.
├── Actions/               # Single-purpose invokables (__invoke). Prefer over Services for one verb.
├── Jobs/                  # Queueable. `implements ShouldQueue`. Idempotent. Set `$tries`, `$backoff` explicitly.
├── Events/ + Listeners/   # Domain events. Listeners are queueable by default.
├── Policies/              # Authorization. Registered in AuthServiceProvider.
└── Providers/             # Service container bindings. Bind interfaces here, not in controllers.

config/                    # Per-service config files. Read via config('services.foo.key'), not env() at runtime.
database/
├── migrations/            # Timestamped. Never edit after merge.
├── factories/             # Model factories. One per model.
└── seeders/

routes/{web,api,console}.php
tests/{Feature,Unit}/      # Feature uses RefreshDatabase; Unit avoids it.
```

`bootstrap/app.php` (Laravel 11) is the single configuration entrypoint. Middleware, exceptions, and routing register there.

## Conventions

- **Style:** Pint with the `laravel` preset. PSR-12 underneath.
- **Naming:** `User` model, `users` table, `UserController`, `UserPolicy`, `StoreUserRequest` (verb + Model + `Request`).
- **Validation:** every write endpoint takes a `FormRequest`. Inline `$request->validate([...])` is acceptable only for trivial cases.
- **Eloquent:** relationships and scopes in models; mass assignment via `$fillable`, never `$guarded = []`.
- **Services and Actions:** services take their dependencies via the constructor and resolve through the container. No `app()->make()` inside business logic.
- **Jobs:** `implements ShouldQueue`. Use `ShouldBeUnique` for natural-key dedup, or `Bus::chain` when steps must serialize. Always set `public int $tries` and `public int $backoff`.
- **Migrations:** reversible (`up`/`down` both filled). Backfills run in a separate migration from the schema change.

## Tests

- **Where:** `tests/Feature/` mirrors HTTP routes and end-to-end behavior; `tests/Unit/` for pure classes.
- **Run one file:** `./vendor/bin/pest tests/Feature/UserTest.php`. Filter by name: `--filter='it creates a user'`.
- **DB:** `uses(RefreshDatabase::class)` in feature tests. Postgres test DB via `DB_DATABASE=testing` in `.env.testing`. Transactions per test, no truncation.
- **Mock policy:** external HTTP via `Http::fake()`. Time via `Carbon::setTestNow()`. Queue assertions via `Queue::fake()` and `Bus::fake()`. **Never mock Eloquent models directly.** Use factories.
- **Factories:** `User::factory()->count(3)->create()`. Prefer `make()` over `create()` when persistence isn't needed.
- **HTTP assertions:** `$this->postJson(...)->assertOk()->assertJsonPath('data.id', $user->id)`.

## External APIs

Three patterns for auth-bound third-party APIs (Stripe, Mailgun, AWS, Twilio, and similar):

1. **`.env` + `config/services.php`.** Add a key block to `config/services.php`, read via `config('services.foo.key')`. Bind clients in a service provider. Laravel-native, ships with the framework.
2. **Doppler, Vault, or 1Password Connect.** Centralized secrets injected at boot. Best for orgs with a rotation policy.
3. **Authsome.** Provider declared in code; credentials in `~/.authsome/`. Cross-language so a PHP app and a Python worker share auth. Most concise. See [authsome.dev](https://authsome.dev).

Pick one. Mixing `.env` and Doppler in the same repo is the most common source of "works on my machine".

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

*Production references:* [laravel/laravel](https://github.com/laravel/laravel) · [laravel/framework](https://github.com/laravel/framework) · [LaravelDaily/laravel-tips](https://github.com/LaravelDaily/laravel-tips)
