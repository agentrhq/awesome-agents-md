---
stack_slug: tauri-2-rust-react
display_name: Tauri 2 · Rust 1.85 · React 19 · TypeScript 5.6 · Vite 6 · SQLite · Vitest · Playwright
components: [tauri-2, rust-1-85, react-19, typescript-5-6, vite-6, sqlx, vitest-2, playwright-1-45]
verified_with: []
last_verified: 2026-05-27
maintainer: agentrhq
license: CC0-1.0
---

# Tauri 2 + Rust + React + Vite + SQLite

A modern desktop app stack. Rust backend with an IPC seam, React 19 frontend bundled by Vite, SQLite via sqlx or the Tauri SQL plugin, signed cross-platform installers via GitHub Actions.

## Why these choices

- **Tauri 2 over Electron.** ~5MB installer instead of ~100MB, system WebView instead of bundled Chromium, Rust backend for native-speed work.
- **React 19 + TS over Vue or Svelte.** Largest ecosystem, the strongest TypeScript story, easy hire pool.
- **Vite 6.** ESM-native dev server, lighting-fast HMR, paired well with Tauri's reload model.
- **sqlx over diesel.** Async-first, compile-time SQL checking against a real DB, less ceremony for desktop scale.
- **pnpm over npm/yarn.** Speed and strict dep isolation.
- **Playwright for E2E.** Drives the built app reliably across platforms.

## What to tune

- Swap React for Svelte or Solid if you want smaller bundles. Tauri itself doesn't care.
- Drop `tauri-plugin-sql` if all DB access lives in Rust. Pick one entrypoint per table to avoid concurrent-writer surprises.
- For multi-window apps (settings + main + tray), each window gets its own capability file under `src-tauri/capabilities/`.
- If you don't ship updates often, skip the updater plugin entirely. It adds a signing key to your release flow.

## Verification

`verified_with` is empty until someone runs the stock prompt through Codex, Cursor, Jules, and Aider and attaches the logs. See [CONTRIBUTING.md](../../CONTRIBUTING.md#verification).
