# Example prompts · Phoenix + Ecto + Postgres + Oban + ExUnit

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated endpoint

> Add a `GET /api/users` controller action that returns users with cursor pagination. Page size 20, sorted by `id` ascending. Include an ExUnit test using `ConnCase` that seeds 50 users and walks two pages.

What good looks like: `Accounts.list_users/1` in the context takes a keyword `cursor:` option; query uses `where: u.id > ^cursor, order_by: u.id, limit: 20`, no `offset`; controller is under 20 lines and only calls the context; test uses `async: true` and the conn helpers.

## 2. Idempotent background job

> Add an Oban worker `MyApp.Workers.SendWelcomeEmail` that calls the mailer. Enqueued on user creation. Idempotent: enqueueing twice for the same user_id within 1 hour must not send twice.

What good looks like: `use Oban.Worker, queue: :mailers, unique: [period: 3600, fields: [:args, :worker]]`; worker function pattern-matches on `%{args: %{"user_id" => id}}`; test uses `Oban.Testing.assert_enqueued/1` and inline mode for execution; idempotency proven by enqueueing twice and asserting `assert_enqueued/1` matches once.

## 3. Migration with backfill

> The `users.timezone` column must become non-nullable, defaulting to `"UTC"`. Write the migration sequence.

What good looks like: migration 1 adds the column nullable with default `"UTC"`; a `priv/repo/data_migrations/<ts>_backfill_user_timezone.exs` script (or a one-off Oban job) backfills existing rows; migration 2 sets `null: false`. Three steps, not one. Each Ecto migration uses `flush()` only when strictly needed. The agent should refuse to combine these.

## 4. Refactor and extraction

> The `UserController.create/2` action has grown to 80 lines with changeset building, Stripe customer creation, and Oban enqueueing inline. Extract a `MyApp.Accounts.register_user/1` function that returns `{:ok, user} | {:error, reason}`. The controller drops below 20 lines.

What good looks like: context function uses `Ecto.Multi` to wrap the changeset insert and side effects; Stripe call is in a separate context (`Billing.create_customer/1`) called from inside the multi; on success returns `{:ok, %User{}}`, on failure returns a typed `{:error, atom, changeset}`; controller pattern-matches the result and renders accordingly.

## 5. External API integration

> Add a `MyApp.Billing.create_stripe_customer(user)` function. Pull credentials per the External APIs section. Add a `Mox`-based test that asserts the API call shape without hitting Stripe.

What good looks like: a `MyApp.Billing.StripeClient` behaviour is defined; production uses a `Tesla` or `Req` client reading config from `runtime.exs` (option 1), Doppler (option 2), or `:authsome_stripe` (option 3); test sets a `StripeMock` via `Mox.expect/3`; function returns `{:ok, customer_id} | {:error, reason}`; no real network call.
