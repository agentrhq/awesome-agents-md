# Example prompts · SwiftUI + SwiftData + XCTest

Prompts that should land cleanly with this AGENTS.md loaded. Use as verification smoke tests.

## 1. Paginated list view

> Add a `PostListView` that displays posts from SwiftData with infinite scroll, loading 20 at a time. Use `@Query` with a fetch descriptor and trigger the next page when the last visible row appears.

What good looks like: `PostListView.swift` uses `@Query(sort: \.createdAt, order: .reverse, animation: .default)` with a paginated descriptor; row-level `.onAppear` triggers the next fetch via a `@State` page counter; a `#Preview` mounts an in-memory `ModelContainer` with seed data.

## 2. Async task with cancellation

> Add a `SyncService` that pulls remote posts on app launch and on pull-to-refresh. The task must cancel cleanly when the view disappears, and must not double-fire if the user pulls twice in quick succession.

What good looks like: `SyncService` is a protocol with a `@MainActor` default impl; the view calls `.task { await sync.run() }`; an internal `Task` handle and `isRunning` flag in the service short-circuits the second call; tests fake the protocol and assert single execution.

## 3. SwiftData schema migration with backfill

> Add a `displayName` property to the `User @Model`. Existing users have only `firstName` and `lastName`; backfill `displayName` to `"\(firstName) \(lastName)"`. Use a `VersionedSchema` migration.

What good looks like: `SchemaV1` and `SchemaV2` types with a `MigrationStage.custom` between them; the `willMigrate` closure iterates existing users and writes the computed value; `ModelContainer` is constructed with the migration plan; an XCTest case migrates a seeded store and asserts the backfill.

## 4. View decomposition

> The `OrderDetailView` is 350 lines. Extract the line-items section, the totals panel, and the action footer into separate subviews. Each subview ships a `#Preview`.

What good looks like: `OrderLineItemsView`, `OrderTotalsView`, `OrderActionFooterView` as separate files under `Views/Order/`; each takes a typed value parameter (not the whole `Order`); each has a `#Preview` with mock data; `OrderDetailView` drops to ~80 lines.

## 5. External API integration

> Add a `BillingClient` protocol with a Stripe-backed default impl that creates a customer. Use the External APIs pattern from AGENTS.md for the API key. Test the client by injecting a `URLProtocol` stub.

What good looks like: `BillingClient` protocol with `createCustomer(email:) async throws -> Customer`; default impl reads the key from Keychain (option 1) or a generated `Secrets.swift` (option 2); test in `<App>Tests/BillingClientTests.swift` registers a `URLProtocol` subclass to intercept requests and assert URL, headers, and body shape.
