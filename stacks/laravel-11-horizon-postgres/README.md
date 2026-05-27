---
stack_slug: laravel-11-horizon-postgres
display_name: Laravel 12 · Horizon · Postgres 16 · Pest 3
components: [laravel-12, php-8.4, horizon-5, redis-7, postgres-16, pest-3]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Laravel 12 + Horizon + Postgres + Pest

The modern Laravel monolith. Horizon for Redis-backed queues, Postgres as the primary store, Pest as the test runner, FormRequests for validation, thin controllers, services or actions for business logic. (Folder keeps the legacy `laravel-11-horizon-postgres` slug; contents target Laravel 12.)

## Why these choices

- **Laravel 12 over 11.** Same streamlined skeleton (`bootstrap/app.php` is the single config entrypoint) plus stabilized first-party ops tooling: Pulse, Reverb, Pennant, Folio, Volt. PHP 8.4 features baked in.
- **Horizon over the bare `queue:work`.** Real dashboard, throughput metrics, balancer strategies, alerting. The operator tooling matters when jobs misbehave at 3am.
- **Pest 3 over PHPUnit.** Same engine underneath, faster to write, the `it()` / `expect()` syntax matches how teams describe behavior.
- **Postgres over MySQL.** Better JSON support, real `RETURNING`, mature concurrency. Laravel's native Schema Builder handles column changes; `doctrine/dbal` is no longer a dependency.
- **Actions and Services over fat models.** Keeps Eloquent files about persistence, not about workflow.

## What to tune

- Swap Horizon for Laravel's database queue if you don't run Redis. Lower ops cost, fewer features.
- Drop the Vite/Tailwind setup if you're API-only.
- If you're not on multi-tenant, remove the `tenant` middleware pattern.
- Pint can be swapped for PHP-CS-Fixer if the team has an existing config.

## Verification

Verified against the structure of `coollabsio/coolify` (Laravel 12 + Horizon + Pulse + Nightwatch) and `cachethq/core` (Laravel + Pest + Pint), both of which ship a real root AGENTS.md.

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
