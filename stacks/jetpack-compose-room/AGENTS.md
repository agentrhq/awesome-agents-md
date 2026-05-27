# AGENTS.md · Android · Kotlin 2.3.21 · Jetpack Compose · Room 2.8.4 · Hilt 2.52 · Coroutines · Coil 3

## Stack

- **IDE:** Android Studio Ladybug or Meerkat. AGP 8.7+. Gradle 8.x with the Kotlin DSL.
- **Language:** Kotlin 2.3.21 on JDK 25 LTS. KSP 2.x replaces KAPT for annotation processing.
- **UI:** Jetpack Compose for Android (BOM `2026.x.x`). Compose UI 1.11.2, Compose Material3 1.4.0.
- **Persistence:** Room 2.8.4 over SQLite. Type-safe entities, Flow-returning DAOs.
- **DI:** Hilt 2.52+. KSP processor, no KAPT.
- **Async:** Coroutines + Flow throughout. `StateFlow` for UI state, `SharedFlow` for one-shot events.
- **Images:** Coil 3 (`coil-compose`). No Glide or Picasso in new code.
- **Tests:** JUnit 4 for unit, AndroidJUnit4 + Compose UI test for instrumentation, Turbine for Flow assertions, MockK for mocking.

## Run

- Sync + build: `./gradlew assembleDebug`
- Install on a connected device: `./gradlew installDebug`
- Unit tests: `./gradlew test`
- Instrumentation tests (device or emulator required): `./gradlew connectedDebugAndroidTest`
- Lint: `./gradlew lintDebug` (Android Lint), `./gradlew ktlintCheck` (formatting), `./gradlew detekt` (style)
- Format: `./gradlew ktlintFormat`
- Release App Bundle: `./gradlew bundleRelease`

Build outputs:
- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `app/build/outputs/bundle/release/app-release.aab`

Expected runtimes: clean assemble ≤90s with the build cache primed, unit test cycle ≤30s, instrumentation suite depends on emulator boot. Use the AVD command-line snapshot to skip cold boot in CI.

## Architecture

```
app/
├── src/main/java/com/<org>/<app>/
│   ├── MyApplication.kt              # @HiltAndroidApp.
│   ├── MainActivity.kt               # @AndroidEntryPoint. Hosts NavHost.
│   ├── navigation/                   # NavGraph definitions, route sealed types.
│   ├── feature/
│   │   ├── auth/
│   │   │   ├── ui/                   # @Composable screens, ViewModels, UI state.
│   │   │   ├── data/                 # Repository implementations, Room DAOs, remote sources.
│   │   │   └── domain/               # Use cases, domain models. Pure Kotlin.
│   │   └── home/
│   ├── core/
│   │   ├── designsystem/             # Theme, typography, color tokens.
│   │   ├── network/                  # Retrofit/Ktor client, interceptors.
│   │   └── database/                 # Room database class, migrations.
│   └── di/                           # @Module @InstallIn(SingletonComponent::class) bindings.
├── src/test/                         # Unit tests. No Android dependencies.
├── src/androidTest/                  # Instrumentation. Uses Hilt test runner.
└── build.gradle.kts                  # App module build script.
```

Feature modules own their UI + data + domain. Cross-feature contracts go through `core/`. The `app/` module is the composition root and the only place that wires features together.

## Conventions

- **Package by feature.** `com.acme.feature.auth` over `com.acme.ui.LoginScreen`.
- **State holders:** every screen has a `ViewModel` exposing `StateFlow<UiState>`. The composable consumes `viewModel.uiState.collectAsStateWithLifecycle()`.
- **Events:** one-shot UI events flow through `SharedFlow<UiEvent>` with `replay = 0`. Snackbars, navigation triggers, toasts.
- **No `Context` in ViewModels.** Inject `@ApplicationContext` only when you must; prefer pulling the resource through a repository.
- **Composable naming:** `PascalCase` for `@Composable` functions, stateless first. `LoginScreen(state, onEvent)` over `LoginScreen(viewModel)`.
- **Modifier order:** caller-provided `modifier: Modifier = Modifier` always first parameter after content.
- **Coroutines:** launch from `viewModelScope` in ViewModels, `lifecycleScope` in activities, `rememberCoroutineScope()` in composables. Never `GlobalScope`.
- **Room migrations:** `Migration(from, to)` objects in `core/database/migrations/`. Schema JSON checked into `app/schemas/`.

## Tests

- **Unit:** plain JUnit 4 under `src/test/`. ViewModel tests use `runTest`, `Dispatchers.setMain(StandardTestDispatcher())`, and Turbine for Flow assertions.
- **Repository:** unit tests mock the DAO with MockK or a fake DAO returning `flowOf(...)`. Don't bring up Room here.
- **Room DAO:** instrumentation tests under `src/androidTest/` using `Room.inMemoryDatabaseBuilder` plus a real Android runtime.
- **Compose UI:** `createAndroidComposeRule<ActivityName>()` or `createComposeRule()` for content-only tests. Use semantics, not pixels.
- **Hilt in tests:** `@HiltAndroidTest` with `HiltTestApplication` via a custom runner. Replace bindings with `@TestInstallIn`.
- **No `Thread.sleep`.** Use Espresso's `IdlingResource` or `composeTestRule.waitUntil { }`.

## Ops

- **Distribution:** Google Play Console with staged rollouts (1%, 10%, 50%, 100%). Internal app sharing for stakeholder builds.
- **Bundles, not APKs.** Ship `.aab`. Play handles per-device APK splits.
- **Signing:** upload key in `gradle.properties` (gitignored) or environment variables; Play App Signing manages the release key.
- **Crash and performance:** Firebase Crashlytics + Firebase Performance Monitoring. Wire the Gradle plugins, gate by build type so debug builds don't pollute prod data.
- **CI:** GitHub Actions with `gradle/actions/setup-gradle@v4`. Run unit tests on every PR; run instrumentation on an emulator matrix (`reactivecircus/android-emulator-runner`) before release.
- **R8/ProGuard:** keep rules in `proguard-rules.pro`. Add `-keep` rules for reflection-based libraries (Room schemas, Moshi/Kotlinx Serialization classes) when shrinking.

## External APIs

Build-time constants flow through `BuildConfig`. Non-committed local config goes in `local.properties`, surfaced via the Secrets Gradle Plugin:

```kotlin
// app/build.gradle.kts
secrets {
    propertiesFileName = "secrets.properties"
    defaultPropertiesFileName = "local.defaults.properties"
}

// generated BuildConfig.STRIPE_PUBLISHABLE_KEY consumed in code
```

Read `BuildConfig` from the `app/` module only. Library modules generate their own `BuildConfig` and will not see the app's values. Runtime secrets and OAuth tokens go in `EncryptedSharedPreferences` or the Android Keystore via `androidx.security:security-crypto`.

For zero-redeploy rotation, Authsome ships short-lived credentials per provider. See [authsome.dev](https://authsome.dev).

## Don't

- Don't reach for `LiveData` in new code. `StateFlow` integrates cleaner with Compose and coroutines.
- Don't read `BuildConfig` from inside a library module expecting the app's values. The lib's own `BuildConfig` is generated independently.
- Don't hold a `Context` reference in a ViewModel field. Pass it through a repository or inject `@ApplicationContext`. Activity contexts leak.
- Don't launch coroutines from `Activity.onCreate` without `lifecycleScope`. Bare `CoroutineScope(...).launch { }` survives configuration changes and leaks.
- Don't forget `@Composable` on a function that calls another composable. The compiler will catch it, but the diagnostic is downstream.
- Don't ship without ProGuard rules for reflection. Room, Moshi, and Kotlinx Serialization generate or read classes by name, R8 strips them silently.
- Don't put long-running work on `Dispatchers.Main`. Wrap with `withContext(Dispatchers.IO)` for disk and network.
- Don't query Room on `Dispatchers.Main`. Room's `suspend` DAO methods already switch dispatchers; raw `runBlocking` undoes that.

## Vendor notes

- **Codex / agents.md:** canonical. Well under the 32 KiB Codex cap.
- **Cursor:** reads this file. Pair with `.cursor/rules/android.mdc` for IDE-specific globs.
- **Jules:** root AGENTS.md only.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.
- **Android Studio AI Assistant / Gemini in Android Studio:** picks up AGENTS.md when placed at the project root.

---

*Production references:* [android/nowinandroid](https://github.com/android/nowinandroid/blob/main/AGENTS.md) · [duckduckgo/Android](https://github.com/duckduckgo/Android/blob/main/AGENTS.md) · [k9mail/k-9](https://github.com/k9mail/k-9/blob/main/AGENTS.md)
