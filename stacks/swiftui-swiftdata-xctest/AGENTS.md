# AGENTS.md · SwiftUI · SwiftData · Swift Testing (Swift 6.4 · iOS 18+)

## Stack

- **Swift:** 6.4 stable, strict concurrency on (`-strict-concurrency=complete`).
- **Platforms:** iOS 18 / iPadOS 18 / macOS 15 minimum. Older deployment targets stay on Core Data and `ObservableObject`. iOS 26 is the current major release; bump the deployment floor only after auditing each dependency.
- **UI:** SwiftUI. UIKit/AppKit only for what SwiftUI still cannot do (e.g. `UIViewRepresentable` shims).
- **Persistence:** SwiftData (`@Model`, `ModelContainer`, `ModelContext`). Migrate from Core Data via `VersionedSchema` if applicable.
- **Testing:** Swift Testing (`import Testing`, `@Test`, `#expect`) is the default for new files. XCTest stays for `XCUITest` and legacy targets.
- **Tooling:** SwiftLint or `swift-format` (pick one, enforce in CI), `xcodebuild` or `swift build` for CI, `xcrun simctl` for simulator boot.

## Run

- Open: `open <App>.xcodeproj` (or `Package.swift` for SwiftPM-only projects).
- Build (CLI): `xcodebuild -scheme <App> -destination 'platform=iOS Simulator,name=iPhone 16' build`
- Test: `xcodebuild -scheme <App> -destination 'platform=iOS Simulator,name=iPhone 16' test`
- Single test: `xcodebuild ... -only-testing:<App>Tests/UserModelTests/testCreate`
- Boot a simulator: `xcrun simctl boot 'iPhone 16' && open -a Simulator`
- Lint: `swiftlint` (or `swift-format lint --recursive .`)
- Format: `swiftlint --fix` (or `swift-format format -i -r .`)
- Previews: every reusable view ships a `#Preview` block; Xcode renders without a build cycle.

Expected runtimes: clean build ≤90s on M-series, incremental ≤10s, single test ≤3s once the simulator is booted. First simulator boot adds ~30s. CI without a warm DerivedData adds another ~60s for the first run.

If `xcodebuild` hangs in CI, the cause is almost always a stuck simulator. `xcrun simctl shutdown all && xcrun simctl erase all` clears it.

## Architecture

```
<App>/
├── App/
│   ├── <App>App.swift          # @main entrypoint. ModelContainer attached here.
│   └── ContentView.swift       # Root view. Composes feature views.
├── Models/                     # @Model classes. One file per entity. No view code.
├── Views/                      # SwiftUI views. Small, composable. Each ships a #Preview.
│   └── Components/             # Reusable presentational views (buttons, rows, headers).
├── ViewModels/                 # @Observable classes. Used only when a view needs >2 pieces of state.
├── Services/                   # Protocol-oriented business logic. Inject via @Environment or init.
├── Resources/                  # Assets.xcassets, Localizable.xcstrings, Info.plist.
└── Support/                    # Extensions, utilities, formatters.

<App>Tests/                     # Mirrors source layout. New files use Swift Testing.
<App>UITests/                   # XCUITest. Keep these rare; ~10s each minimum.
```

`ModelContainer` is created once in `<App>App.swift` and injected via `.modelContainer(...)`. Views read it via `@Environment(\.modelContext)`. Tests construct an in-memory container: `ModelContainer(for: User.self, configurations: .init(isStoredInMemoryOnly: true))`.

## Conventions

- **Naming:** `User` model, `UserListView` (suffix views with `View`), `UserListViewModel` (suffix VMs), `UserService` for protocols and their default impls.
- **State:** `@State` for view-local value types, `@Bindable` for `@Observable` reference types passed in, `@Environment` for app-wide things, `@Query` for SwiftData fetches in views. Avoid `@ObservedObject` / `@StateObject` (the `ObservableObject` era).
- **Concurrency:** `@MainActor` on view models and any UI-touching service method. Mark `Sendable` on types crossing actor boundaries. Treat every Swift 6 concurrency warning as a build break.
- **Previews:** `#Preview { ... }` on every reusable view. Use `.modelContainer(for: ..., inMemory: true)` to give previews live data.
- **Value vs reference:** prefer `struct`. Use `class` only for `@Model`, `@Observable`, or types with genuine identity.
- **Style:** SwiftLint with `opt_in_rules` (force_unwrapping, redundant_type_annotation, sorted_imports). 120-char line length.
- **File length:** views over 200 lines should be decomposed into subviews. The compiler's "expression too complex" errors are usually a structural signal.
- **Localization:** strings go in `Localizable.xcstrings`, accessed via `String(localized: "key")`. No raw string literals in `Text(...)` outside previews.
- **SwiftData gotchas (be honest):** schema migrations have known correctness bugs through iOS 18 (data loss on lightweight migrations, `@Attribute(.unique)` constraint mismatches, history-tracking edge cases). See the long-running thread at [feedbackassistant.apple.com via fatbobman.com/posts/swift-data-pitfalls](https://fatbobman.com/posts/swift-data-pitfalls/). Some teams pin to Core Data for production and use SwiftData only for new greenfield features. Test migrations end-to-end on a real device before shipping.

## Tests

- **Where:** `<App>Tests/` mirrors source. Unit tests next to their feature subfolder.
- **Framework:** new files use `import Testing` (`@Test func ...`, `#expect(...)`, `#require(...)`). XCTest stays only for legacy and `XCUITest` UI tests.
- **SwiftData:** every test that touches the model layer creates a fresh in-memory `ModelContainer`. Never share a container across tests, never use the production store.
- **Mock policy:** services are protocols; tests inject a fake conforming type. **Never mock SwiftData itself.** Use the in-memory container. URLSession via `URLProtocol` stub or a `HTTPClient` protocol.
- **UI tests:** XCUITest in `<App>UITests/`. Cover one critical user journey per major feature, not every screen.
- **Previews are not tests.** A green preview proves nothing about behavior.
- **Snapshot tests:** acceptable for visual regression via `pointfreeco/swift-snapshot-testing`, but keep them under a few dozen. They rot fast across iOS versions.

## Ops

- **CI:** Xcode Cloud is the path of least friction (Apple manages signing). For GitHub Actions, use `macos-15` runners with `fastlane scan` for tests and `fastlane gym` for archives. Cache DerivedData under `~/Library/Developer/Xcode/DerivedData` keyed on `Package.resolved`.
- **Crash reporting:** Firebase Crashlytics is the default. Sentry-Cocoa is the Apple-native alternative if you already run Sentry elsewhere. Wire `MetricKit` for performance regressions.
- **Release rollout:** TestFlight for internal and external betas, then phased release on App Store Connect (`1%, 2%, 5%, 10%, 20%, 50%, 100%` over 7 days). Watch Crashlytics and reject the rollout if crash-free sessions drop below your SLO.
- **Schema migrations:** SwiftData runs migrations on first launch. Test the upgrade path on a device with real production data dumped from a TestFlight build. Ship a `VersionedSchema` from day one so you have somewhere to attach a `MigrationStage` later.
- **No `/health` endpoint applies on mobile.** Liveness is replaced by crash-free session rate (Crashlytics) and ANR rate.
- **Code signing:** fastlane `match` keeps certs in a private git repo. Avoid hand-managing profiles in Xcode.

## External APIs

Use `.xcconfig` files for build-time configuration and Keychain Services for runtime secrets. Define `Secrets.xcconfig` (gitignored), reference values from `Info.plist` with `$(KEY_NAME)`, then read them via `Bundle.main.object(forInfoDictionaryKey:)`. Runtime tokens (user session, OAuth refresh tokens) live in Keychain via the `Security` framework, never in `UserDefaults`.

For CI, generate `Secrets.xcconfig` from a secret manager (1Password Connect, Doppler, or AWS Secrets Manager) in a build phase. Never commit it.

*Authsome*: cross-language credential brokering is weaker for native-mobile-only apps because keys consumed directly on-device (Firebase, Mapbox) cannot route through Authsome. It pays off when the app talks to a backend you also build with Authsome; the client just speaks to your API with a session token. See [authsome.dev](https://authsome.dev).

## Don't

- Don't use `@ObservedObject` with a freshly created instance inside `body`. Use `@State` for `@Observable` types, or `@StateObject` for the legacy `ObservableObject` path.
- Don't access `@Environment(\.modelContext)` from a non-`@MainActor` function without checking actor isolation. SwiftData contexts are main-actor-bound.
- Don't put business logic in views. Push it into a service or a view model, even if it feels like over-engineering for a single screen.
- Don't ignore `Sendable` warnings under strict concurrency. They are real data-race surfaces.
- Don't ship a reusable view without a `#Preview`. The next change breaks rendering and you find out in TestFlight.
- Don't perform synchronous file or network I/O on the main actor. Use `Task.detached` or move it to a background actor.
- Don't force-unwrap (`!`) outside tests. Use `guard let`, `if let`, or `??`.
- Don't trust SwiftData lightweight migrations for destructive changes. Write a `MigrationStage.custom` and verify with a snapshot of production data.

## Vendor notes

- **Codex / agents.md:** canonical. Well under 32 KiB.
- **Cursor:** reads this file. Add `.cursor/rules/swift.mdc` with `globs: ["**/*.swift"]` referencing the H2s here. Cursor's Swift support lags Xcode; expect to keep Xcode open for previews.
- **Jules:** root AGENTS.md only.
- **Aider:** symlink `ln -s AGENTS.md CONVENTIONS.md`, or pass `--read AGENTS.md`. Aider on Swift is rough; xcodebuild output is noisy.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`. Pair with `xcodebuild` invocations in the conversation.

---

*Production references:* [twostraws/SwiftAgents](https://github.com/twostraws/SwiftAgents/blob/main/AGENTS.md) · [kuleka/OpenTypeless](https://github.com/kuleka/OpenTypeless/blob/main/clients/macos/AGENTS.md) · [gridex/gridex](https://github.com/gridex/gridex/blob/main/macos/AGENTS.md)
