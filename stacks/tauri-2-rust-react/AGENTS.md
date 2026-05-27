# AGENTS.md · Tauri 2 · Rust 1.85 · React 19 · TypeScript 5.6 · Vite 6 · SQLite · Vitest · Playwright

## Stack

- **Desktop shell:** Tauri 2.x (released late 2024, currently on the 2.11 line). System WebView, Rust backend, IPC via `invoke()`.
- **Backend language:** Rust stable 1.85+. `rustup show` pins the toolchain via `rust-toolchain.toml`.
- **Frontend:** React 19 + TypeScript 5.6+. Vite 6 for dev server and build. Strict mode TS, no `any`.
- **Persistence:** SQLite via `tauri-plugin-sql` (frontend-accessible) or `sqlx` (Rust-side, when business logic needs the DB). Pick one entrypoint per table.
- **Logging and crashes:** `tauri-plugin-log` for structured logs, `sentry-tauri` for crash reports.
- **Tests:** `cargo test` for Rust, Vitest 2 for React unit + component, Playwright 1.45+ for E2E driving the built app.
- **Package manager:** pnpm 9 via `corepack enable`.

## Run

- Install: `pnpm install --frozen-lockfile && cargo fetch --manifest-path src-tauri/Cargo.toml`
- Dev (Vite + Tauri): `pnpm tauri dev` (Vite on :1420 by default, Tauri window attaches)
- Build app bundles: `pnpm tauri build` (per-platform installer in `src-tauri/target/release/bundle/`)
- Frontend-only dev: `pnpm dev` (no Rust window)
- Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Frontend tests: `pnpm test` (Vitest), `pnpm test --run` for one-shot
- E2E: `pnpm e2e` (Playwright; expects `pnpm tauri build` artifacts)
- Lint: `pnpm lint` (ESLint + Prettier on TS), `cargo clippy --all-targets -- -D warnings` on Rust
- Typecheck: `pnpm typecheck` (`tsc --noEmit`)

Expected runtimes: `pnpm tauri dev` cold start ≤15s (Rust compile dominates), `pnpm tauri build` ≤5min per platform on cold cache, Vitest cycle ≤10s. The first Rust compile after a clean is slow; subsequent runs use the incremental cache.

## Architecture

```
.
├── src/                              # React + TypeScript frontend.
│   ├── main.tsx                      # Vite entry. Mounts <App />.
│   ├── App.tsx
│   ├── features/                     # Feature slices. One folder per bounded domain.
│   │   └── <feature>/
│   │       ├── ui/                   # React components.
│   │       ├── hooks/                # Custom hooks, queries.
│   │       └── api/                  # invoke() wrappers, typed.
│   ├── lib/
│   │   ├── invoke.ts                 # Typed wrapper over @tauri-apps/api.
│   │   └── env.ts                    # import.meta.env validation (Zod).
│   └── styles/
├── src-tauri/                        # Rust backend.
│   ├── src/
│   │   ├── main.rs                   # tauri::Builder setup, commands registered.
│   │   ├── commands/                 # #[tauri::command] functions, one file per feature.
│   │   ├── db/                       # sqlx pool, migrations, repositories.
│   │   └── domain/                   # Pure Rust types and services. No tauri imports.
│   ├── Cargo.toml
│   ├── tauri.conf.json               # App identity, bundle config, capabilities.
│   ├── capabilities/                 # Per-window permission sets (Tauri 2 ACL).
│   └── icons/
├── public/                           # Static assets served by Vite.
└── package.json
```

The IPC boundary is the seam. Every Rust command has a matching TypeScript wrapper in `src/lib/invoke.ts` so types stay in sync. Don't call `invoke('foo', ...)` from random components.

## Conventions

- **Typed `invoke` wrapper.** `src/lib/invoke.ts` exports `getUser(id: string): Promise<User>`. Components never call raw `invoke()`.
- **Rust commands return `Result<T, AppError>`** with `AppError` as a `serde::Serialize` enum. Never `unwrap()` or `expect()` in command bodies.
- **Tokio for async, `spawn_blocking` for CPU work.** Long-running CPU tasks (image transcode, hashing) go through `tokio::task::spawn_blocking` so they don't stall the runtime.
- **Capabilities in `src-tauri/capabilities/`.** Each window has an allowlist. Adding a new command means adding it here too, or the frontend silently fails.
- **Migrations:** `sqlx migrate add <slug>` creates a file under `src-tauri/migrations/`. Embed with `sqlx::migrate!()` at startup.
- **State management (frontend):** `@tanstack/react-query` for server state (the Rust backend is "the server"). Zustand or jotai only when local UI state grows beyond a component tree.
- **CSS:** Tailwind 3.4 or CSS modules. No runtime CSS-in-JS.

## Tests

- **Rust unit:** `cargo test --lib` in `src-tauri/`. Pure functions and domain logic only. No Tauri runtime here.
- **Rust commands:** test the handler function directly with a mocked state. Tauri's `tauri::test::mock_app` is also available for richer cases.
- **Frontend unit:** Vitest with `@testing-library/react`. Mock the `invoke` wrapper, not `@tauri-apps/api` directly.
- **E2E:** Playwright drives the built app. CI runs against `pnpm tauri build` artifacts; locally use `pnpm tauri dev` plus `webServer` config.
- **Snapshot policy:** avoid. Explicit assertions only.
- **No `setTimeout` waits.** Playwright's `expect.poll` or React Testing Library's `waitFor` instead.

## Ops

- **CI matrix:** GitHub Actions on `macos-latest`, `windows-latest`, `ubuntu-latest`. The `tauri-apps/tauri-action` builds and uploads installers.
- **Code signing:** Apple Developer ID + notarization on macOS (cert + private key in `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD` secrets), Authenticode cert on Windows (`WINDOWS_CERTIFICATE`). Linux ships unsigned `.deb` and `.AppImage`.
- **Auto-update:** `tauri-plugin-updater` polls a static manifest. Host the manifest and the signed bundles on Cloudflare R2, S3, or GitHub Releases. Sign each release with the Tauri updater key.
- **Crash reports:** Sentry via `sentry-tauri`. DSN in `tauri.conf.json` only for release builds, never debug.
- **Analytics:** PostHog desktop SDK if needed. Off by default, gated behind a settings toggle.
- **Telemetry policy:** document what is collected in-app. Tauri apps are user-installed binaries, surprises become reviews.

## External APIs

Tauri config (`src-tauri/tauri.conf.json`) declares capability allowlists and bundle identifiers. At dev time, env vars come from a `.env` file consumed by Vite (`import.meta.env.VITE_*` is browser-visible, `import.meta.env.*` without the prefix stays server-side).

For runtime secrets (OAuth tokens, API keys), use the OS keyring via `tauri-plugin-stronghold` or the `keyring` Rust crate:

```rust
let entry = keyring::Entry::new("my-app", "stripe_api_key")?;
let key = entry.get_password()?;
```

Don't ship `VITE_STRIPE_SECRET=...`. Anything `VITE_*`-prefixed ends up in the bundled JavaScript. Public publishable keys are fine; secrets are not. For zero-redeploy rotation, Authsome injects credentials per provider. See [authsome.dev](https://authsome.dev).

## Don't

- Don't call `invoke()` from React without going through the typed wrapper. Drift between Rust signatures and TS callsites is the #1 silent bug.
- Don't `.unwrap()` or `.expect()` in `#[tauri::command]` bodies. A panic on the Rust side crashes the renderer with no UI message.
- Don't add a new command and forget to list it in `src-tauri/capabilities/`. The frontend call silently rejects in production builds.
- Don't enable `withGlobalTauri: true` in `tauri.conf.json`. It bloats the runtime and is intended for legacy migrations.
- Don't run heavy CPU work on the main async runtime. Wrap with `tokio::task::spawn_blocking` so other commands stay responsive.
- Don't bundle secrets into `VITE_*` env vars. They ship in the JS bundle and are trivially extractable.
- Don't skip notarization on macOS. Unnotarized apps trigger Gatekeeper warnings and lose user trust.
- Don't hand-write SQL string interpolation. Use `sqlx::query!` or parameter binding.

## Vendor notes

- **Codex / agents.md:** canonical. Well under the 32 KiB Codex cap.
- **Cursor:** reads this file. Keep `.cursor/rules/` empty or use globs to point back at this file.
- **Jules:** root AGENTS.md only.
- **Aider:** does not auto-discover yet. Run `aider --read AGENTS.md`, or symlink `ln -s AGENTS.md CONVENTIONS.md`.
- **Claude Code:** symlink `ln -s AGENTS.md CLAUDE.md`.
- **rust-analyzer / IntelliJ Rust:** AGENTS.md is plain markdown, no IDE integration needed.

---

*Production references:* [CapSoftware/Cap](https://github.com/CapSoftware/Cap/blob/main/AGENTS.md) · [lcomplete/huntly](https://github.com/lcomplete/huntly/blob/main/AGENTS.md) · [codeforreal1/compressO](https://github.com/codeforreal1/compressO/blob/main/AGENTS.md)
