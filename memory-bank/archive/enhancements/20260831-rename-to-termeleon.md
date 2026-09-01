---
task_id: rename-to-termeleon
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: rename-to-termeleon

## SUMMARY

Renamed the package and extension identifier across manifests, source code, command contributions, configuration properties, state storage, tests, and documentation to `termeleon` (`Termeleon`). Completed on branch `feature/rename-to-termeleon` with pull request [PR #26](https://github.com/Texarkanine/vscode-terminal-themes/pull/26) opened to `main`.

## REQUIREMENTS

- Update `package.json` manifest (`name: "termeleon"`, `displayName: "Termeleon"`, `repository: "https://github.com/Texarkanine/termeleon.git"`, expanded keyword tags).
- Rename commands from `terminalThemeImport.*` to `termeleon.*` with category `Termeleon`.
- Rename configuration properties from `terminalThemeImport.*` to `termeleon.*` with title `Termeleon`.
- Update `src/extension.ts` `CONFIG` to `'termeleon'`.
- Update `src/apply.ts` `OWNED_STATE` to `'termeleon.ownedKeys'` (clean break with no legacy shims).
- Add manifest contract tests in `test/parsers.test.ts`.
- Update host tests in `test/host/apply.test.ts` and `test/host/preview.test.ts`.
- Update `README.md`, `memory-bank/systemPatterns.md`, and `memory-bank/techContext.md`.
- Open a GitHub pull request from feature branch.

## IMPLEMENTATION

1. `package.json` & `package-lock.json`: Set package name to `termeleon`, display name to `Termeleon`, updated repo URLs, and expanded keywords (`ghostty`, `kitty`, `alacritty`, `wezterm`, `iterm2`, `windows-terminal`, `xresources`, `palette`, `terminal-themes`, `mirror`, `import`). Commands and settings schema aligned to `termeleon.*`.
2. `src/extension.ts` & `src/apply.ts`: Changed extension configuration prefix and settings target to `termeleon`. Updated owned state storage key to `termeleon.ownedKeys`.
3. `test/parsers.test.ts`: Added contract assertions verifying `package.json` identity, contributed commands, and configuration properties.
4. `test/host/*.test.ts`: Cleaned up host test setups to track `termeleon.ownedKeys`.
5. `README.md` & memory bank: Replaced all occurrences of legacy naming with `termeleon`.

Key files: `package.json`, `package-lock.json`, `src/extension.ts`, `src/apply.ts`, `test/parsers.test.ts`, `test/host/apply.test.ts`, `test/host/preview.test.ts`, `README.md`, `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`.

## TESTING

- `npm run test:parsers`: 53/53 passed (including new manifest and settings contract assertions).
- `npm run test:host`: 30/30 passed in Extension Development Host (testing apply, live preview, and settings ownership).
- `npm run package`: Packaged clean `termeleon-0.1.0.vsix` without warnings.
- `npm run compile`: Clean build and bundle via `esbuild`.
- Preflight: Passed with advisory.
- QA: Passed full check across KISS, DRY, YAGNI, Completeness, Regression, Integrity, and Documentation.

## LESSONS LEARNED

- For unreleased (0.x) software, clean-break changes avoid unnecessary backward-compatibility shims, keeping the codebase simple and maintainable.
- Fast manifest contract tests in the vscode-free test suite (`test/parsers.test.ts`) catch schema mismatches instantly during build/CI without needing an extension host.

## PROCESS IMPROVEMENTS

- None. The Level 2 workflow and TDD sequencing executed seamlessly.

## TECHNICAL IMPROVEMENTS

- None. Manifest contracts and source code are fully aligned with no dangling references.

## NEXT STEPS

- Merge [PR #26](https://github.com/Texarkanine/vscode-terminal-themes/pull/26) into `main` after renaming the repository on GitHub.
