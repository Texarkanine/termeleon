# Tech Context

VS Code extension (`terminal-theme-import`) written in TypeScript, bundled to a single CommonJS file with esbuild. The published artifact is `dist/extension.js`; the host supplies `vscode`, `fs`, `os`, and `path`. End users do not need Node installed. The only runtime dependency (`smol-toml`) is bundled at build time.

## Environment Setup

Using the extension requires VS Code 1.75+ on a local desktop (not vscode.dev / browser-only Codespaces). Developing it requires Node and npm: `npm install` at the repo root. There is no `package-lock.json` in the tree today.

The project is licensed AGPL-3.0-or-later via the root `LICENSE` file (`license` in `package.json` matches). No per-file SPDX / REUSE inventory.

## Build Tools

- TypeScript project: `tsconfig.json` (`strict`, CommonJS, ES2021). `include` is `src/**/*.ts` only — tests are not part of the `tsc` program.
- Bundle and typecheck: `compile` in `package.json` (`tsc --noEmit` then esbuild of `src/extension.ts`, `vscode` external, Node platform).
- Packaging ignore list: `.vscodeignore` (source, tests, and TypeScript stay out of the VSIX).

## Testing Process

Parser, palette, and discovery tests are a small Node assert harness in `test/parsers.test.ts` and `test/discover.test.ts`, run with `tsx` via `test:parsers` in `package.json` (two processes). Fixtures live under `test/fixtures/`. Discovery tests build a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree and assert on `origin` paths under that tree — not on result length or theme name, because Darwin still walks `/Applications/Ghostty.app`. This suite does not load `vscode` and does not cover `apply.ts` or `extension.ts`.

Executable-behavior changes follow TDD as in `.cursor/rules/shared/always-tdd.mdc`. How to run tests while iterating is in `.cursor/rules/shared/test-running-practices.mdc`.
