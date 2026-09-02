# Tech Context

VS Code extension (`termeleon`) written in TypeScript, bundled to a single CommonJS file with esbuild. The published artifact is `dist/extension.js`; the host supplies `vscode`, `fs`, `os`, and `path`. End users do not need Node installed. The only runtime dependency (`smol-toml`) is bundled at build time.

## Environment Setup

Using the extension requires VS Code 1.75+ on a local desktop (not vscode.dev / browser-only Codespaces). Developing it requires Node and npm. Node is pinned in `.nvmrc`. `npm ci` at the repo root uses the committed `package-lock.json`. Generate or refresh that lockfile from a clean tree (no `node_modules`); npm 10 otherwise prunes other-platform optional packages (esbuild) and linux CI cannot `npm ci`. The lockfile also pins the host-test runner versions (`@vscode/test-electron`, `@vscode/test-cli`). F5 debugging is configured via `.vscode/launch.json` ("Run Extension") and `.vscode/tasks.json` (`npm: compile`).

The project is licensed AGPL-3.0-or-later via the root `LICENSE` file (`license` in `package.json` matches). No per-file SPDX / REUSE inventory.

## Build Tools

- TypeScript project: `tsconfig.json` (`strict`, CommonJS, ES2021). `include` is `src/**/*.ts` only — the parser suite is not part of this `tsc` program. Host tests compile via `tsconfig.test.json`.
- Bundle and typecheck: `compile` in `package.json` (`tsc --noEmit` then esbuild of `src/extension.ts`, `vscode` external, Node platform).
- Packaging ignore list: `.vscodeignore` (source, tests, TypeScript, `.github/`, agent/memory-bank trees, local scratch assets, developer `README.md`, and release-please config/manifest stay out of the VSIX; extension icon at `images/icon.png` and store readme at `STORE.md` are bundled).
- Package: `package` in `package.json` (`prepackage` compiles, then `vsce package --no-dependencies --readme-path STORE.md`). Publisher id is `texarkanine` (matching registered Open VSX namespace), icon is configured at `images/icon.png`, and marketplace store readme is sourced from `STORE.md`.
- CI: `.github/workflows/ci.yaml` on `pull_request` and `push` to `initialdev` and `main`. Job uses `actions/setup-node` with `.nvmrc` and npm cache, then `npm ci`, `npm run test:coverage` (with `c8` emitting `coverage/lcov.info`), `codecov/codecov-action` using `CODECOV_TOKEN`, `npm run compile`, `npm run package`. No REUSE lint or VS Marketplace publish.

## Testing Process

Two suites, both wired from `package.json`:

- Parser, palette, discovery, and CI-contract tests: Node assert harness in `test/parsers.test.ts` and `test/discover.test.ts`, run with `tsx` via `test:parsers` (two processes). Fixtures live under `test/fixtures/`. Discovery tests build a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree and assert on `origin` paths under that tree — not on result length or theme name, because Darwin still walks `/Applications/Ghostty.app`. Extra-directory tests pass `extraDirs` and filter `origin` under the fixture directory. `parsers.test.ts` also holds a `ci` section that locks the GitHub Actions contract (lockfile, `.nvmrc`, workflow commands), Dependabot toolchain policy (`typescript` `>=7.0.0` and `@types/node` `>=23.0.0` ignored; `@types/node` major matches `.nvmrc`), and packaging/release contracts. This suite does not load `vscode`.
- Extension-host tests: Mocha TDD under `test/host/`, launched by `vscode-test` as configured in `.vscode-test.mjs`. They cover `apply.ts` (including `LivePreview`) against real `workbench.colorCustomizations` via `inspect` at one target. `.vscode-test.mjs` passes a short `--user-data-dir` under `os.tmpdir()` because macOS unix-socket paths cap around 103 characters; the default `.vscode-test/user-data` under a long worktree path fails with `EINVAL`.

`npm test` runs parsers then host. Executable-behavior changes follow TDD as in `.cursor/rules/shared/always-tdd.mdc`. How to run tests while iterating is in `.cursor/rules/shared/test-running-practices.mdc`.

## Releases

Tagged GitHub releases are cut from conventional commits on `main` by release-please (`release-please-config.json`, `.github/workflows/release-please.yaml`). The version it bumps is `package.json` `version` (`release-type: node`). The workflow mints a GitHub App token from `vars.DOGGO_BOT_APP_ID` (passed as `client-id`) and `secrets.DOGGO_BOT_PRIVATE_KEY`; do not invent extra secrets. When a release is created, the job packages a VSIX and `gh release upload`s it using that token, and a downstream `publish-openvsx` deployment job publishes to Open VSX under the `open-vsx.org` environment using `secrets.OPENVSX_TOKEN`. There is no VS Marketplace, AMO, or Chrome Web Store publish job.
