---
stack_slug: laravel-11-horizon-postgres
display_name: Laravel 11 · Horizon · Postgres 16 · Pest 3
components: [laravel-11, php-8.3, horizon, redis-7, postgres-16, pest-3]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Laravel 11 + Horizon + Postgres + Pest

The modern Laravel monolith. Horizon for Redis-backed queues, Postgres as the primary store, Pest as the test runner, FormRequests for validation, thin controllers, services or actions for business logic.

## Why these choices

- **Laravel 11 over 10.** Streamlined skeleton (`bootstrap/app.php` is the single config entrypoint), per-second rate limiting, and modern PHP 8.3 features baked in.
- **Horizon over the bare `queue:work`.** Real dashboard, throughput metrics, balancer strategies, alerting. The operator tooling matters when jobs misbehave at 3am.
- **Pest over PHPUnit.** Same engine underneath, faster to write, the `it()` / `expect()` syntax matches how teams describe behavior.
- **Postgres over MySQL.** Better JSON support, real `RETURNING`, mature concurrency. Schema changes need `doctrine/dbal` either way.
- **Actions and Services over fat models.** Keeps Eloquent files about persistence, not about workflow.

## What to tune

- Swap Horizon for Laravel's built-in database queue or Solid Queue if you don't need Redis. Lower ops cost, fewer features.
- Drop the Vite/Tailwind setup if you're API-only.
- If you're not on multi-tenant, remove the `tenant` middleware pattern.
- Pint can be swapped for PHP-CS-Fixer if the team has an existing config.

## Verification

Laravel codebases that publish a real AGENTS.md aren't common yet. This entry leans on `laravel/laravel` framework conventions and the patterns in `LaravelDaily/laravel-tips`. Send a PR with whatever your team's AGENTS.md actually says.

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
