# Example prompts · Jetpack Compose + Room + Hilt + Coroutines

Prompts that should land cleanly when a coding agent has this stack's AGENTS.md loaded. Use them as smoke tests when verifying the file against a new agent.

## 1. Paginated list (Room + Compose)

> Add a `PostListScreen` that displays posts from Room with paging. Page size 20, sorted by `createdAt` desc. Use `androidx.paging:paging-compose`. Include a Room instrumentation test that asserts the DAO returns the expected page sizes.

What good looks like: `PostDao.pagingSource(): PagingSource<Int, PostEntity>`; ViewModel exposes `Flow<PagingData<Post>>` via `cachedIn(viewModelScope)`; screen consumes `collectAsLazyPagingItems()`; instrumentation test in `app/src/androidTest/` uses `Room.inMemoryDatabaseBuilder`.

## 2. Cache invalidation on background sync

> Add a `SyncPostsWorker` (WorkManager) that pulls fresh posts hourly and invalidates the Room cache. Add a unit test that mocks the network and asserts the worker writes to the DAO once per run.

What good looks like: `@HiltWorker` with constructor injection of the repository; `Result.retry()` on transient network failures; unit test uses `TestListenableWorkerBuilder` and a fake repository; idempotent on duplicate runs (same `workName` with `ExistingPeriodicWorkPolicy.UPDATE`).

## 3. Room schema migration with backfill

> The `User.timezone` column needs to become non-nullable, defaulting to `UTC`. Bump the Room schema version and write the migration plus the backfill. Two `Migration` objects, not one.

What good looks like: Migration 1 adds nullable column with default; Migration 2 updates existing rows to `UTC`; Migration 3 (separate PR) sets NOT NULL via a table-rebuild migration. Schema JSON files under `app/schemas/` are committed.

## 4. Refactor: stateless composables

> The `LoginScreen` composable currently reads from `LoginViewModel` directly. Refactor into a stateful container (`LoginRoute`) that injects the ViewModel and a stateless `LoginScreen(state, onEvent)`. Add a Compose UI test that drives the stateless screen with fake state.

What good looks like: `LoginRoute(viewModel: LoginViewModel = hiltViewModel())` reads state and forwards events; `LoginScreen` takes `state: LoginUiState`, `onEvent: (LoginUiEvent) -> Unit`; UI test uses `createComposeRule()` without bringing up Hilt.

## 5. External API integration (Retrofit + Hilt)

> Add a `StripeApi.createCustomer(email)` using Retrofit. Pull credentials per the External APIs section. Add a unit test with `MockWebServer` that asserts the request shape without hitting the network.

What good looks like: Retrofit interface in `core/network/`; OkHttp `Authorization` interceptor reading `BuildConfig.STRIPE_SECRET_KEY` (test build type uses a stub key); Hilt module under `core/network/di/`; test uses `MockWebServer` with `server.enqueue(MockResponse())` and asserts `request.path` and headers.
