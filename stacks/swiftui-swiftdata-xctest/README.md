---
stack_slug: swiftui-swiftdata-xctest
display_name: SwiftUI · SwiftData · Swift Testing (Swift 6.4 · iOS 18+)
components: [swift-6.4, swiftui, swiftdata, swift-testing, xctest, swiftlint]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# SwiftUI + SwiftData + Swift Testing

The modern Apple-native app stack. SwiftUI for the view layer, SwiftData for persistence (with eyes open), the Observation framework (`@Observable`) for view models, Swift Testing as the default test runner with XCTest reserved for UI tests.

## Why these choices

- **SwiftUI over UIKit.** iOS 18 is the floor; SwiftUI covers what every shipping app needs. UIKit stays accessible via `UIViewRepresentable` for the remaining gaps.
- **SwiftData over Core Data, with caveats.** Codegen-free, value-type-friendly, designed for the Observation framework. Schema migrations still have known bugs through iOS 18, so test the upgrade path on real data and consider Core Data for the riskiest persistence paths.
- **`@Observable` over `ObservableObject`.** Granular updates, less boilerplate, no `@Published` per property. `@Bindable` replaces `@ObservedObject` at the call site.
- **Swift Testing over XCTest for new files.** Cleaner syntax, parallel by default, better failure output. XCTest stays for `XCUITest`.
- **Protocols for services.** Real fakes for tests, no mocking framework needed.

## What to tune

- Swap SwiftData for Core Data if you need rock-solid migrations or you ship to iOS 17 and earlier.
- Swap the Observation framework for The Composable Architecture if your app has deeply nested state and you want testable reducers.
- Replace SwiftLint with `swift-format` for projects on Swift 6 toolchains; the rules diverge.
- Drop `Localizable.xcstrings` if you ship in one language.

## Verification

Public AGENTS.md files for iOS codebases remain uncommon. This entry is verified against `twostraws/SwiftAgents` (Paul Hudson's reference), `kuleka/OpenTypeless` (Swift 6 + SwiftUI + SwiftData + Swift Testing macOS app), and `Stygian-Tech/Routines` (SwiftUI + SwiftData + CloudKit). Send a PR if your app ships something different.

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). Verification for Swift requires Cursor or Aider with `xcodebuild` reachable; Codex and Jules support is uneven.
