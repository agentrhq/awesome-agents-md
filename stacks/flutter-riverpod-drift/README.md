---
stack_slug: flutter-riverpod-drift
display_name: Flutter 3.32+ · Riverpod 2.5 · Drift · go_router
components: [flutter-3.32, dart-3.5, riverpod-2.5, drift, go_router, very_good_analysis]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Flutter + Riverpod + Drift + go_router

The opinionated modern Flutter stack. Riverpod for state, Drift for local SQL, `go_router` for navigation, feature-first directory layout, codegen everywhere.

## Why these choices

- **Riverpod 2.5 over Provider or Bloc.** Compile-time-safe with the `@riverpod` annotation, granular rebuilds, easy overrides in tests. Provider is the old API; Bloc is fine but heavier.
- **Drift over `sqflite` directly.** Typed queries, codegen, real schema migrations. SQLite ships as a native library via FFI (`sqlite3_flutter_libs`); the cost is the FFI build step on first compile and a codegen pass on schema changes.
- **`go_router` over Navigator 1.0 or 2.0 by hand.** Declarative, deep-linkable, typed routes via `go_router_builder`.
- **Feature-first directory layout.** Scales past 10 features without devolving into `screens/`, `widgets/`, `models/` mega-folders.
- **`very_good_analysis`.** Strict lint preset from Very Good Ventures; catches real bugs.

## What to tune

- Drop Drift for `sqflite` + raw SQL if your data layer is one or two tables.
- Swap `go_router` for `auto_route` if the team prefers route-class codegen.
- If you don't need persistence at all, remove the `db/` layer and keep state in Riverpod only.
- `melos` is overkill for single-app repos. Add it only when you split into packages.

## Verification

Verified against `CarGuo/gsy_github_app_flutter` (large-scale Flutter app with a real AGENTS.md), `omnimind-ai/OpenOmniBot` (Flutter + Riverpod with codegen), and `MimicHunterZ/PocketMind` (Flutter 3.24+ / Riverpod 3.0 stack guide). Send a PR if your Flutter codebase has something better.

`verified_with` is empty until someone attaches verification logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification). Codex and Cursor handle Dart well; Jules and Aider are uneven on Flutter widget code.
