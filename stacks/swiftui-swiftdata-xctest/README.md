---
stack_slug: swiftui-swiftdata-xctest
display_name: SwiftUI · SwiftData · XCTest (Swift 5.10+ / 6)
components: [swift-5.10, swift-6, swiftui, swiftdata, xctest, testing-framework, swiftlint]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# SwiftUI + SwiftData + XCTest

The modern Apple-native app stack. SwiftUI for the view layer, SwiftData for persistence, the Observation framework (`@Observable`) for view models, XCTest plus the new Testing framework on Swift 6.

## Why these choices

- **SwiftUI over UIKit.** iOS 17 is the floor; SwiftUI covers what every shipping app needs. UIKit stays accessible via `UIViewRepresentable` for the remaining gaps.
- **SwiftData over Core Data.** Codegen-free, value-type-friendly, designed for the Observation framework. Older targets stay on Core Data.
- **`@Observable` over `ObservableObject`.** Granular updates, less boilerplate, no `@Published` per property. `@Bindable` replaces `@ObservedObject` at the call site.
- **Testing framework over XCTest for new files.** Cleaner syntax, parallel by default, better failure output. XCTest stays for UI tests.
- **Protocols for services.** Real fakes for tests, no mocking framework needed.

## What to tune

- Swap SwiftData for Core Data if you ship to iOS 16 or earlier.
- Swap the Observation framework for The Composable Architecture if your app has deeply nested state and you want testable reducers.
- Replace SwiftLint with `swift-format` for projects on Swift 6 toolchains; the rules diverge.
- Drop `Localizable.xcstrings` if you ship in one language.

## Verification

Public AGENTS.md files for iOS codebases aren't common. The closest reference is [twostraws/SwiftAgents](https://github.com/twostraws/SwiftAgents) (1.3k stars); this entry also borrows from Apple's sample code and Point-Free's testing patterns. Send a PR if your app ships something different.

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). Verification for Swift requires Cursor or Aider with `xcodebuild` reachable; Codex and Jules support is uneven.
