---
stack_slug: rails-8-sidekiq-postgres
display_name: Rails 8 · Sidekiq 7 · Postgres 16 · RSpec 6
components: [rails-8, sidekiq-7, sidekiq-cron, postgres-16, rspec-6, hotwire]
verified_with: []
last_verified: 2026-05-27
maintainer: agentr-labs
license: CC0-1.0
---

# Rails 8 + Sidekiq + Postgres + RSpec

The canonical "Rails monolith with background jobs" stack. Hotwire for the frontend, Sidekiq for jobs, RSpec because the community defaults to it even after the Rails team standardized on Minitest.

## Why these choices

- **Rails 8 over 7.** Solid Queue, Solid Cache, Solid Cable, and Propshaft are in. ActionMailbox and ActionText are mature.
- **Sidekiq over Solid Queue.** Solid Queue is great, but Sidekiq has a decade of operator tooling (sidekiq-cron, sidekiq-pro, sidekiq-ent, sidekiqmon). For production today, that ecosystem wins.
- **RSpec over Minitest.** RSpec is what teams pick. The brief is to match real practice.
- **Hotwire over React.** Aligned with the Rails 8 default and the framework's center of gravity.

## What to tune

- Swap Sidekiq for Solid Queue if you don't need scheduled jobs or the operator ecosystem.
- Drop ViewComponent if your views are simple. Good pattern, real learning cost.
- Remove the mailers section if you don't use ActionMailbox.

## Verification

Pilot entry. `verified_with` is empty until a maintainer attaches verification logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
