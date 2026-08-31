# Tech Context

VS Code extension (`terminal-theme-import`) written in TypeScript, bundled to a single CommonJS file with esbuild. The published artifact is `dist/extension.js`; the host supplies `vscode`, `fs`, `os`, and `path`. End users do not need Node installed. The only runtime dependency (`smol-toml`) is bundled at build time.

## Environment Setup

Using the extension requires VS Code 1.75+ on a local desktop (not vscode.dev / browser-only Codespaces). Developing it requires Node and npm: `npm install` at the repo root. `package-lock.json` pins the host-test runner versions.

The project is licensed AGPL-3.0-or-later via the root `LICENSE` file (`license` in `package.json` matches). No per-file SPDX / REUSE inventory.

## Build Tools

- TypeScript project: `tsconfig.json` (`strict`, CommonJS, ES2021). `include` is `src/**/*.ts` only — the parser suite is not part of this `tsc` program. Host tests compile via `tsconfig.test.json`.
- Bundle and typecheck: `compile` in `package.json` (`tsc --noEmit` then esbuild of `src/extension.ts`, `vscode` external, Node platform).
- Packaging ignore list: `.vscodeignore` (source, tests, TypeScript, `.github/`, and release-please config/manifest stay out of the VSIX).

## Testing Process

Two suites, both wired from `package.json`:

- Parser, palette, and discovery tests: Node assert harness in `test/parsers.test.ts` and `test/discover.test.ts`, run with `tsx` via `test:parsers` (two processes). Fixtures live under `test/fixtures/`. Discovery tests build a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree and assert on `origin` paths under that tree — not on result length or theme name, because Darwin still walks `/Applications/Ghostty.app`. Extra-directory tests pass `extraDirs` and filter `origin` under the fixture directory. This suite does not load `vscode`.
- Extension-host tests: Mocha TDD under `test/host/`, launched by `vscode-test` as configured in `.vscode-test.mjs`. They cover `apply.ts` (including `LivePreview`) against real `workbench.colorCustomizations` via `inspect` at one target. `.vscode-test.mjs` passes a short `--user-data-dir` under `os.tmpdir()` because macOS unix-socket paths cap around 103 characters; the default `.vscode-test/user-data` under a long worktree path fails with `EINVAL`.

`npm test` runs parsers then host. Executable-behavior changes follow TDD as in `.cursor/rules/shared/always-tdd.mdc`. How to run tests while iterating is in `.cursor/rules/shared/test-running-practices.mdc`.

## Releases

Tagged GitHub releases are cut from conventional commits on `main` by release-please (`release-please-config.json`, `.github/workflows/release-please.yaml`). The version it bumps is `package.json` `version` (`release-type: node`). The workflow sets `target-branch` to `${{ github.ref_name }}` because the GitHub default branch is still `initialdev`; without that, release-please would open the release PR against `initialdev`. The workflow mints a GitHub App token from org `HELPER_APP_ID` (passed as `client-id`) and `HELPER_APP_PRIVATE_KEY`; do not invent extra secrets. There is no VS Marketplace, AMO, or Chrome Web Store publish job.
