# Example prompts · Flutter + Riverpod + Drift + go_router

Prompts that should land cleanly with this AGENTS.md loaded. Use as verification smoke tests.

## 1. Paginated list view

> Add a `PostListScreen` that displays posts from Drift with keyset pagination, 20 per page, ordered by `createdAt` desc. Use a Riverpod `AsyncNotifier` that exposes a `loadMore()` method. Trigger on scroll-near-bottom.

What good looks like: `lib/features/posts/presentation/post_list_screen.dart` with a `ListView.builder` and a `NotificationListener<ScrollNotification>`; `posts_notifier.dart` is a generated `@riverpod` `AsyncNotifier<List<Post>>` with `loadMore`; the Drift query uses `WHERE created_at < ? ORDER BY created_at DESC LIMIT 20`. No `OFFSET`.

## 2. Idempotent async task

> Add a `SyncTask` that pulls remote posts and upserts them into Drift. The task must be safe to call twice in rapid succession (debounce or dedup), and must cancel cleanly when the user backgrounds the app.

What good looks like: `sync_service.dart` exposes `Future<void> run()` guarded by an internal `Completer` so concurrent calls return the same future; cancellation via a `CancelToken` (Dio) or a `Completer<void>` flag; widget tests override the provider with a fake that records call count and assert single execution.

## 3. Drift schema migration with backfill

> Add a `displayName` column to the `users` Drift table. Existing rows must be backfilled to `"$firstName $lastName"`. Bump the schema version and write a `MigrationStrategy.onUpgrade` step.

What good looks like: `users` table class gains `TextColumn get displayName => text()();`; `schemaVersion` increments; the `onUpgrade` callback runs `customStatement('ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ...')` then `UPDATE users SET display_name = first_name || ' ' || last_name`; an integration test opens a v(N-1) database, runs migration, and asserts the backfilled values.

## 4. Widget extraction

> The `OrderDetailScreen` is 400 lines. Extract the line-items section, the totals panel, and the action footer into separate widgets in `lib/features/orders/presentation/`. Each takes typed parameters, not the whole `Order`.

What good looks like: `order_line_items.dart`, `order_totals.dart`, `order_action_footer.dart` as separate widget files; each takes a narrow value type (e.g. `List<LineItem>`, not `Order`); the parent screen drops to ~80 lines. Widget tests cover each extracted widget independently.

## 5. External API integration

> Add a `BillingClient` that calls Stripe to create a customer. Use the External APIs pattern from AGENTS.md. Provide it through a Riverpod provider so tests can override it. Stub HTTP via `mocktail` and `DioAdapter`.

What good looks like: `lib/core/network/billing_client.dart` with a class taking `Dio` via constructor; `billing_client_provider.dart` exposes it via `@riverpod`; the secret is read per the chosen pattern (`String.fromEnvironment`, `envied`, or Authsome); test in `test/unit/billing_client_test.dart` registers a `DioAdapter` and asserts request URL, headers, and body.
