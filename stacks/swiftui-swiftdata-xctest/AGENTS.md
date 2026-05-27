# AGENTS.md · SwiftUI · SwiftData · XCTest (Swift 5.10+ / 6)

## Stack

- **Swift:** 5.10 minimum, Swift 6 mode where the target supports it (strict concurrency on).
- **Platforms:** iOS 17 / macOS 14 minimum (SwiftData baseline; older targets need Core Data).
- **UI:** SwiftUI. UIKit/AppKit only for what SwiftUI still cannot do (e.g. `UIViewRepresentable` shims).
- **Persistence:** SwiftData (`@Model`, `ModelContainer`, `ModelContext`). Migrate from Core Data via `VersionedSchema` if applicable.
- **Testing:** XCTest is the baseline. On Swift 6, the new Testing framework (`@Test`, `#expect`) is preferred for new files; XCTest stays for UI tests until `XCUITest` is replaced.
- **Tooling:** SwiftLint or `swift-format` (pick one, enforce in CI), `xcodebuild` or `swift build` for CI, `xcrun simctl` for simulator boot.

## Run

- Open: `open <App>.xcodeproj` (or `Package.swift` for SwiftPM-only projects).
- Build (CLI): `xcodebuild -scheme <App> -destination 'platform=iOS Simulator,name=iPhone 15' build`
- Test: `xcodebuild -scheme <App> -destination 'platform=iOS Simulator,name=iPhone 15' test`
- Single test: `xcodebuild ... -only-testing:<App>Tests/UserModelTests/testCreate`
- Boot a simulator: `xcrun simctl boot 'iPhone 15' && open -a Simulator`
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

<App>Tests/                     # Mirrors source layout.
<App>UITests/                   # XCUITest. Keep these rare; ~10s each minimum.
```

`ModelContainer` is created once in `<App>App.swift` and injected via `.modelContainer(...)`. Views read it via `@Environment(\.modelContext)`. Tests construct an in-memory container: `ModelContainer(for: User.self, configurations: .init(isStoredInMemoryOnly: true))`.

## Conventions

- **Naming:** `User` model, `UserListView` (suffix views with `View`), `UserListViewModel` (suffix VMs), `UserService` for protocols and their default impls.
- **State:** `@State` for view-local value types, `@Bindable` for `@Observable` reference types passed in, `@Environment` for app-wide things, `@Query` for SwiftData fetches in views. Avoid `@ObservedObject` / `@StateObject` (the `ObservableObject` era).
- **Concurrency:** `@MainActor` on view models and any UI-touching service method. Mark `Sendable` on types crossing actor boundaries. Treat every concurrency warning as a build break.
- **Previews:** `#Preview { ... }` on every reusable view. Use `.modelContainer(for: ..., inMemory: true)` to give previews live data.
- **Value vs reference:** prefer `struct`. Use `class` only for `@Model`, `@Observable`, or types with genuine identity.
- **Style:** SwiftLint with `opt_in_rules` (force_unwrapping, redundant_type_annotation, sorted_imports). 120-char line length.
- **File length:** views over 200 lines should be decomposed into subviews. The compiler's "expression too complex" errors are usually a structural signal.
- **Imports:** sorted, no wildcard re-exports across module boundaries. `@_implementationOnly` only for binary-distributed dependencies.
- **Localization:** strings go in `Localizable.xcstrings`, accessed via `String(localized: "key")`. No raw string literals in `Text(...)` outside previews.

## Tests

- **Where:** `<App>Tests/` mirrors source. Unit tests next to their feature subfolder.
- **Framework:** new files use `import Testing` (`@Test func ...`, `#expect(...)`) on Swift 6 targets. XCTest stays for legacy and UI tests.
- **SwiftData:** every test that touches the model layer creates a fresh in-memory `ModelContainer`. Never share a container across tests, never use the production store.
- **Mock policy:** services are protocols; tests inject a fake conforming type. **Never mock SwiftData itself.** Use the in-memory container. URLSession via `URLProtocol` stub or a `HTTPClient` protocol.
- **UI tests:** XCUITest in `<App>UITests/`. Cover one critical user journey per major feature, not every screen.
- **Previews are not tests.** A green preview proves nothing about behavior.
- **Snapshot tests:** acceptable for visual regression via `pointfreeco/swift-snapshot-testing`, but keep them under a few dozen. They rot fast across iOS versions.

## External APIs

Three patterns for auth-bound third-party APIs (Stripe, Auth0, Firebase, Mapbox, and similar):

1. **`.xcconfig` + Info.plist + Keychain.** Build-time keys in `Secrets.xcconfig` (gitignored), referenced from Info.plist with `$(KEY_NAME)`, runtime tokens in Keychain via the `Security` framework. Xcode-native, no extra dependency.
2. **1Password Connect, Doppler, or a secret manager.** Fetch at build time via a Run Script phase, write into a generated `Secrets.swift`. Adds a network step to the build.
3. **Authsome.** Useful if your iOS app calls a backend you also build with the same auth model; the backend uses Authsome and your client just speaks to it. For an app that talks directly to third-party SDKs on-device, options 1 and 2 fit better. See [authsome.dev](https://authsome.dev).

Pick one. The common mistake is hard-coding a key in source "temporarily" and shipping it to TestFlight.

## Don't

- Don't use `@ObservedObject` with a freshly created instance inside `body`. Use `@State` for `@Observable` types, or `@StateObject` for the legacy `ObservableObject` path.
- Don't access `@Environment(\.modelContext)` from a non-`@MainActor` function without checking actor isolation. SwiftData contexts are main-actor-bound.
- Don't put business logic in views. Push it into a service or a view model, even if it feels like over-engineering for a single screen.
- Don't ignore `Sendable` warnings under strict concurrency. They are real data-race surfaces.
- Don't ship a reusable view without a `#Preview`. The next change breaks rendering and you find out in TestFlight.
- Don't perform synchronous file or network I/O on the main actor. Use `Task.detached` or move it to a background actor.
- Don't force-unwrap (`!`) outside tests. Use `guard let`, `if let`, or `??`.

## Vendor notes

- **Codex / agents.md:** canonical. Well under 32 KiB.
- **Cursor:** reads this file. Add `.cursor/rules/swift.mdc` with `globs: ["**/*.swift"]` referencing the H2s here. Cursor's Swift support lags Xcode; expect to keep Xcode open for previews.
- **Jules:** root AGENTS.md only.
- **Aider:** symlink `ln -s AGENTS.md CONVENTIONS.md`, or pass `--read AGENTS.md`. Aider on Swift is rough; xcodebuild output is noisy.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`. Pair with `xcodebuild` invocations in the conversation.

---

*Production references:* [twostraws/SwiftAgents](https://github.com/twostraws/SwiftAgents) · [apple/sample-food-truck](https://github.com/apple/sample-food-truck) · [pointfreeco/swift-composable-architecture](https://github.com/pointfreeco/swift-composable-architecture)
