---
stack_slug: flutter-riverpod-drift
display_name: Flutter 3.24+ · Riverpod 2 · Drift · go_router
components: [flutter-3.24, dart-3, riverpod-2, drift, go_router, very_good_analysis]
verified_with: []
last_verified: 2026-05-27
maintainer: agentr-labs
license: CC0-1.0
---

# Flutter + Riverpod + Drift + go_router

The opinionated modern Flutter stack. Riverpod for state, Drift for local SQL, `go_router` for navigation, feature-first directory layout, codegen everywhere.

## Why these choices

- **Riverpod over Provider or Bloc.** Compile-time-safe with the `@riverpod` annotation, granular rebuilds, easy overrides in tests. Provider is the old API; Bloc is fine but heavier.
- **Drift over `sqflite` directly.** Typed queries, codegen, real schema migrations. The cost is a codegen step.
- **`go_router` over Navigator 1.0 or 2.0 by hand.** Declarative, deep-linkable, typed routes via `go_router_builder`.
- **Feature-first directory layout.** Scales past 10 features without devolving into `screens/`, `widgets/`, `models/` mega-folders.
- **`very_good_analysis`.** Strict lint preset from Very Good Ventures; catches real bugs.

## What to tune

- Drop Drift for `sqflite` + raw SQL if your data layer is one or two tables.
- Swap `go_router` for `auto_route` if the team prefers route-class codegen.
- If you don't need persistence at all, remove the `db/` layer and keep state in Riverpod only.
- `melos` is overkill for single-app repos. Add it only when you split into packages.

## Verification

Reference repos for production Flutter apps with first-class AGENTS.md files are scarce as of May 2026. This entry leans on the framework conventions in `flutter/flutter`, the strict lint preset in `VeryGoodOpenSource/very_good_cli`, and the canonical patterns in `rrousselGit/riverpod`. A PR from a team running this in production at scale is welcome.

`verified_with` is empty until a maintainer attaches verification logs per [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). Codex and Cursor handle Dart well; Jules and Aider are uneven on Flutter widget code.
