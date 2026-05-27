# Example prompts · Rails 8 + Sidekiq + Postgres + RSpec

Prompts that should land cleanly with this AGENTS.md loaded. Use as verification smoke tests.

## 1. Paginated endpoint

> Add `GET /users` that returns users with keyset pagination (20 per page) by id. Use [Pagy](https://github.com/ddnexus/pagy) or hand-roll. Include an RSpec request spec.

What good looks like: `UsersController#index` with strong params; model scope `User.after(cursor).limit(20)`; request spec in `spec/requests/users_spec.rb`; no `OFFSET`.

## 2. Idempotent Sidekiq job

> Add a Sidekiq worker `SendWelcomeEmailJob` that sends a welcome email. Mark it idempotent. Coalesce duplicate enqueues within 5 minutes.

What good looks like: `app/jobs/send_welcome_email_job.rb` with `sidekiq_options unique_for: 5.minutes`; idempotency guard inside `perform`; spec asserts the email goes once when enqueued twice.

## 3. Migration with backfill

> The `users.timezone` column needs to become NOT NULL, defaulting to 'UTC'. Write the migration plus backfill, in two separate migrations.

What good looks like: migration A adds nullable column with default; migration B backfills via `find_each` in batches; migration C in a later PR sets NOT NULL. The agent should reject any "combine all three" suggestion.

## 4. ViewComponent extraction

> Extract the inline navbar in `app/views/layouts/application.html.erb` into a ViewComponent. Include a spec.

What good looks like: `app/components/navbar_component.rb` + `_navbar.html.erb`; render spec in `spec/components/navbar_component_spec.rb`.

## 5. External API integration

> Add a `BillingClient` service that hits Stripe to create a customer. Use the External APIs pattern from AGENTS.md. Stub Stripe via VCR in the spec.

What good looks like: `app/services/billing_client.rb`; credentials read per the chosen pattern (Rails credentials, Doppler, or Authsome); VCR cassette in `spec/cassettes/`.
