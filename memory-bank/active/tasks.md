# Task: Rename Extension and Repository to Termeleon

* Task ID: rename-to-termeleon
* Complexity: Level 2
* Type: Simple Enhancement

Rename the project and extension across the entire codebase to `termeleon`, including package manifests, command IDs, configuration settings namespace, storage keys, documentation, and tests.

## Test Plan (TDD)

### Behaviors to Verify

- [Behavior 1]: `package.json` manifest declares `name: "termeleon"`, `displayName: "Termeleon"`, `repository` pointing to `Texarkanine/termeleon.git`, and keywords array with emulator tags.
- [Behavior 2]: `package.json` declares commands `termeleon.import`, `termeleon.importGlobal`, `termeleon.importWorkspace`, `termeleon.mirror`, and `termeleon.remove` with category `Termeleon`.
- [Behavior 3]: `package.json` contributes configuration under `termeleon.*` (`termeleon.target`, `termeleon.sources`, `termeleon.extraDirectories`, `termeleon.scopeToActiveTheme`, `termeleon.setMinimumContrastRatio`, `termeleon.includeSelectionForeground`, `termeleon.livePreview`).
- [Behavior 4]: `src/extension.ts` registers command handlers matching `termeleon.*` and reads config from `termeleon`.
- [Behavior 5]: `src/apply.ts` uses `termeleon.ownedKeys` for storing owned color customizations in `globalState` / `workspaceState`.
- [Behavior 6]: Extension host tests (`test/host/apply.test.ts`, `test/host/preview.test.ts`) pass against `termeleon.ownedKeys`.
- [Behavior 7]: VSIX package script `npm run package` produces `termeleon-<version>.vsix`.

### Test Infrastructure

- Framework: Node assert test runner (`test/parsers.test.ts`, `test/discover.test.ts`) + Mocha in Extension Host (`test/host/*.test.ts`).
- Test location: `test/`
- Conventions: vscode-free tests run in `test:parsers` via `tsx`, host tests run in `test:host` via `vscode-test`.
- New test files: none (contract additions to `test/parsers.test.ts` and updates to `test/host/*.test.ts`).

## Implementation Plan

### 1. Contract & Manifest Tests — executable

- Files: `test/parsers.test.ts`

1. Stub tests: add stub contract assertions in `test/parsers.test.ts` for package name, commands, and settings namespace.
2. Stub interface: not required (verifying configuration schema).
3. Write tests and run red: run `npm run test:parsers` and verify failure against current `terminal-theme-import` name.
4. Write code and run green: update `package.json`, `package-lock.json` and verify tests pass.

### 2. Extension Code & State Namespace — executable

- Files: `src/extension.ts`, `src/apply.ts`, `test/host/apply.test.ts`, `test/host/preview.test.ts`

1. Stub tests: update host test setup hooks to clear `termeleon.ownedKeys`.
2. Stub interface: update `CONFIG` and `OWNED_STATE` constants.
3. Write tests and run red: run host test compilation / pretest.
4. Write code and run green: update `src/extension.ts` and `src/apply.ts`, run `npm test`.

### 3. Documentation, Persistent Memory Bank, & CI — prose/policy

- Files: `README.md`, `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. Update `README.md` with new `Termeleon` name, command table, configuration names, and vsix filename.
2. Update `memory-bank/systemPatterns.md` and `memory-bank/techContext.md` to reflect `termeleon` and `termeleon.ownedKeys`.

## Technology Validation

No new technology - validation not required.

## Dependencies

- None (existing TypeScript, esbuild, @vscode/vsce dependencies).

## Challenges & Mitigations

- [Challenge 1]: Package lockfile name drift when changing `package.json`.
  - Mitigation: Run `npm install --package-lock-only` from a clean node tree or update `package-lock.json` root package name directly and verify with `npm ci`.
- [Challenge 2]: Missed references in host test state setups.
  - Mitigation: Grep the entire repository for `terminalThemeImport` and `terminal-theme-import` to ensure zero unintended remnants.

## Pre-Mortem

- [Likely cause if this plan failed]: Incomplete rename leaving dangling command or config strings breaking settings resolution or commands.
  - Plan response: Verified via full workspace grep before and after, plus full test suite (`npm test`) and packaging test (`npm run package`).

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
