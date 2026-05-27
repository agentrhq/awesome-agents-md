# Example prompts · Laravel 11 + Horizon + Postgres + Pest

Prompts that should land cleanly with this AGENTS.md loaded. Use as verification smoke tests.

## 1. Paginated endpoint

> Add `GET /api/posts` that returns posts with cursor pagination (20 per page) ordered by `created_at` desc. Include a Pest feature test that asserts the cursor round-trip.

What good looks like: `PostController@index` is thin, calls `Post::query()->orderByDesc('created_at')->cursorPaginate(20)`; resource shaping via `PostResource`; feature test in `tests/Feature/PostIndexTest.php` uses `RefreshDatabase` and asserts `next_cursor`. No `OFFSET`, no `paginate()`.

## 2. Idempotent background job

> Add a Horizon-queued job `SendWelcomeEmailJob` that emails a user. Mark it idempotent so two enqueues within 5 minutes only send once. Add a Pest test asserting single delivery.

What good looks like: `app/Jobs/SendWelcomeEmailJob.php` implements `ShouldQueue` and `ShouldBeUnique` with `public int $uniqueFor = 300;`; `perform`-equivalent (`handle`) guards on a sent-at column or cache key; test uses `Queue::fake()` and `Mail::fake()` to assert one send.

## 3. Migration with backfill

> The `users.timezone` column needs to become NOT NULL, defaulting to 'UTC'. Write the migration plus backfill in two separate migrations.

What good looks like: migration A adds the nullable column with a default; migration B backfills existing rows using `User::query()->whereNull('timezone')->chunkById(500, ...)`; migration C in a later PR sets NOT NULL. The agent should refuse to combine these into one file.

## 4. Action extraction

> The `StoreOrderController` has a 60-line `store` method. Extract the order-creation logic into a single-purpose invokable `CreateOrderAction`. Update the controller and add a unit test for the action.

What good looks like: `app/Actions/CreateOrderAction.php` with `__invoke(CreateOrderData $data): Order`; constructor-injected dependencies; controller is now ~10 lines; unit test in `tests/Unit/Actions/CreateOrderActionTest.php`.

## 5. External API integration

> Add a `BillingClient` service that hits Stripe to create a customer. Use the External APIs pattern from AGENTS.md. Stub Stripe via `Http::fake()` in the Pest test.

What good looks like: `app/Services/BillingClient.php`; credentials read per the chosen pattern (`config/services.php`, Doppler, or Authsome); container binding in `AppServiceProvider`; test uses `Http::fake(['api.stripe.com/*' => Http::response(...)])` and asserts the request shape.
