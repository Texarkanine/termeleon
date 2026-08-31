# Tech Context

VS Code extension (`terminal-theme-import`) written in TypeScript, bundled to a single CommonJS file with esbuild. The published artifact is `dist/extension.js`; the host supplies `vscode`, `fs`, `os`, and `path`. End users do not need Node installed. The only runtime dependency (`smol-toml`) is bundled at build time.

## Environment Setup

Using the extension requires VS Code 1.75+ on a local desktop (not vscode.dev / browser-only Codespaces). Developing it requires Node and npm: `npm install` at the repo root. There is no `package-lock.json` in the tree today.

The project is licensed AGPL-3.0-or-later via the root `LICENSE` file (`license` in `package.json` matches). No per-file SPDX / REUSE inventory.

## Build Tools

- TypeScript project: `tsconfig.json` (`strict`, CommonJS, ES2021). `include` is `src/**/*.ts` only — tests are not part of the `tsc` program.
- Bundle and typecheck: `compile` in `package.json` (`tsc --noEmit` then esbuild of `src/extension.ts`, `vscode` external, Node platform).
- Packaging ignore list: `.vscodeignore` (source, tests, TypeScript, `.github/`, and release-please config/manifest stay out of the VSIX).

## Testing Process

Parser and palette tests are a small Node assert harness in `test/parsers.test.ts`, run with `tsx` via `test:parsers` in `package.json`. Fixtures live under `test/fixtures/`. This suite does not load `vscode` and does not cover `apply.ts` or `extension.ts`.

Executable-behavior changes follow TDD as in `.cursor/rules/shared/always-tdd.mdc`. How to run tests while iterating is in `.cursor/rules/shared/test-running-practices.mdc`.

## Releases

Tagged GitHub releases are cut from conventional commits on `main` by release-please (`release-please-config.json`, `.github/workflows/release-please.yaml`). The version it bumps is `package.json` `version` (`release-type: node`). The workflow mints a GitHub App token from org `HELPER_APP_ID` (passed as `client-id`) and `HELPER_APP_PRIVATE_KEY`; do not invent extra secrets. There is no VS Marketplace, AMO, or Chrome Web Store publish job.
