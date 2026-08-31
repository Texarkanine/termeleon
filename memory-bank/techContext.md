# Tech Context

VS Code extension (`terminal-theme-import`) written in TypeScript, bundled to a single CommonJS file with esbuild. The published artifact is `dist/extension.js`; the host supplies `vscode`, `fs`, `os`, and `path`. End users do not need Node installed. The only runtime dependency (`smol-toml`) is bundled at build time.

## Environment Setup

Using the extension requires VS Code 1.75+ on a local desktop (not vscode.dev / browser-only Codespaces). Developing it requires Node and npm. Node is pinned in `.nvmrc`. `npm ci` at the repo root uses the committed `package-lock.json`. Generate or refresh that lockfile from a clean tree (no `node_modules`); npm 10 otherwise prunes other-platform optional packages (esbuild) and linux CI cannot `npm ci`.

The project is licensed AGPL-3.0-or-later via the root `LICENSE` file (`license` in `package.json` matches). No per-file SPDX / REUSE inventory.

## Build Tools

- TypeScript project: `tsconfig.json` (`strict`, CommonJS, ES2021). `include` is `src/**/*.ts` only — tests are not part of the `tsc` program.
- Bundle and typecheck: `compile` in `package.json` (`tsc --noEmit` then esbuild of `src/extension.ts`, `vscode` external, Node platform).
- Packaging ignore list: `.vscodeignore` (source, tests, TypeScript, `.github/`, and release-please config/manifest stay out of the VSIX).
- CI: `.github/workflows/ci.yaml` on `pull_request` and `push` to `initialdev` and `main`. Job uses `actions/setup-node` with `.nvmrc` and npm cache, then `npm ci`, `npm run test:parsers`, `npm run compile`. No REUSE lint, Codecov, or `vsce package`.

## Testing Process

Parser, palette, and discovery tests are a small Node assert harness in `test/parsers.test.ts` and `test/discover.test.ts`, run with `tsx` via `test:parsers` in `package.json` (two processes). Fixtures live under `test/fixtures/`. Discovery tests build a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree and assert on `origin` paths under that tree — not on result length or theme name, because Darwin still walks `/Applications/Ghostty.app`. The same `parsers.test.ts` file also holds a `ci` section that locks the GitHub Actions contract (lockfile, `.nvmrc`, workflow commands). This suite does not load `vscode` and does not cover `apply.ts` or `extension.ts`.

Executable-behavior changes follow TDD as in `.cursor/rules/shared/always-tdd.mdc`. How to run tests while iterating is in `.cursor/rules/shared/test-running-practices.mdc`.

## Releases

Tagged GitHub releases are cut from conventional commits on `main` by release-please (`release-please-config.json`, `.github/workflows/release-please.yaml`). The version it bumps is `package.json` `version` (`release-type: node`). The workflow sets `target-branch` to `${{ github.ref_name }}` because the GitHub default branch is still `initialdev`; without that, release-please would open the release PR against `initialdev`. The workflow mints a GitHub App token from org `HELPER_APP_ID` (passed as `client-id`) and `HELPER_APP_PRIVATE_KEY`; do not invent extra secrets. There is no VS Marketplace, AMO, or Chrome Web Store publish job.
