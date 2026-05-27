---
stack_slug: jetpack-compose-room
display_name: Android · Kotlin 2.3.21 · Jetpack Compose · Room 2.8.4 · Hilt 2.52 · Coroutines · Coil 3
components: [kotlin-2.3.21, jetpack-compose, compose-ui-1.11.2, compose-material3-1.4.0, room-2.8.4, hilt-2.52, coroutines, coil-3, ksp-2, gradle-8, jdk-25]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Jetpack Compose + Room + Hilt + Coroutines

The default modern Android app stack. Compose for UI, Room for local persistence, Hilt for DI, Coroutines and Flow for async, all wired with KSP.

## Why these choices

- **Compose over XML views.** Less boilerplate, recomposition model fits state-driven UI. Tooling is finally mature.
- **Room over raw SQLite.** Compile-time SQL checks, Flow-returning DAOs that integrate with Coroutines.
- **Hilt over manual DI or Koin.** First-class Android lifecycle scoping (`@HiltViewModel`, `@ActivityRetainedScoped`) without runtime resolution cost.
- **KSP over KAPT.** 2-4x faster annotation processing on the build.
- **StateFlow over LiveData.** Coroutine-native, plays cleaner with Compose.
- **Coil over Glide.** Smaller, Kotlin-native, Compose integration is the official path.

## What to tune

- Drop Hilt for Koin if the app is small and you want runtime DI swapping in tests.
- Swap Room for SQLDelight if you want shared persistence across Kotlin Multiplatform targets.
- For media-heavy apps, layer ExoPlayer / Media3 on top.
- For Wear OS or TV targets, add the Wear or TV Compose modules in feature-specific source sets.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
