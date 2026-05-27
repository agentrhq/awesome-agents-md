---
stack_slug: rails-8-sidekiq-postgres
display_name: Rails 8.0 · Sidekiq 7 · Postgres 16 · RSpec 6 · Kamal 2
components: [rails-8, sidekiq-7, sidekiq-cron, postgres-16, rspec-6, hotwire, kamal-2, ruby-3.4]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Rails 8.0 + Sidekiq + Postgres + RSpec + Kamal 2

The canonical "Rails monolith with background jobs" stack. Hotwire on the frontend, Sidekiq for jobs, RSpec because the community defaults to it even after the Rails team standardized on Minitest. Kamal 2 ships the app to any VPS or Docker host.

## Why these choices

- **Rails 8 over 7.** Solid Queue, Solid Cache, Solid Cable, and Propshaft are in. ActionMailbox and ActionText are mature. Kamal 2 is the default deploy story.
- **Sidekiq over Solid Queue.** Solid Queue is now the Rails 8 default and is excellent for new projects. Existing teams with sidekiq-cron, sidekiq-pro, sidekiqmon, or sidekiq-ent stay on Sidekiq for the operator tooling. Pick one per app and don't mix.
- **RSpec over Minitest.** RSpec is what most teams pick. The brief is to match real practice.
- **Hotwire over React.** Aligned with the Rails 8 default and the framework's center of gravity.
- **Kamal 2 over Capistrano or Heroku.** Builds a Docker image, ships it to your servers, runs migrations as a pre-deploy hook, swaps containers through Traefik.

## What to tune

- Swap Sidekiq for Solid Queue if you're starting fresh and don't need the sidekiq-pro ecosystem.
- Drop ViewComponent if your views are simple. Good pattern, real learning cost.
- Remove the mailers section if you don't use ActionMailbox.
- Replace Kamal with Heroku, Render, or Fly if you don't want to operate a VPS.

## Verification

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
