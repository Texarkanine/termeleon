# Task: F5 Extension Development Host Launch Configuration

* Task ID: f5-launch-config
* Complexity: Level 2
* Type: Simple Enhancement

Add standard `.vscode/launch.json` and `.vscode/tasks.json` configuration files so contributors can press F5 in VS Code to build and debug the extension in an Extension Development Host window.

## Test Plan (TDD)

### Behaviors to Verify

- Launch config contract: reading `.vscode/launch.json` → parses as valid JSON with a "Run Extension" configuration having `type: "extensionHost"`, `request: "launch"`, and `preLaunchTask: "npm: compile"`.
- Tasks config contract: reading `.vscode/tasks.json` → parses as valid JSON defining the `npm: compile` task (or `type: "npm"`, `script: "compile"`).
- VSIX exclusion: `.vscodeignore` contains `.vscode/**` → `.vscode/` files are excluded from the packaged extension artifact.
- Extension build: running `npm run compile` → produces `dist/extension.js` without errors.

### Test Infrastructure

- Framework: Node assert test suite in `test/parsers.test.ts`
- Test location: `test/parsers.test.ts`
- Conventions: `test('description', () => { ... })` assert pattern under `repoRoot`
- New test files: none (added to `test/parsers.test.ts` contract tests)

## Implementation Plan

### 1. Launch & tasks contract tests — executable

- Files: `test/parsers.test.ts`, `.vscode/launch.json`, `.vscode/tasks.json`

1. [x] Stub tests: Add empty test cases `launch.json contract` and `tasks.json contract` in `test/parsers.test.ts`.
2. [x] Stub interface: Ensure `.vscode/` directory exists.
3. [x] Write tests and run red: Implement assertions in `test/parsers.test.ts` checking `.vscode/launch.json` and `.vscode/tasks.json` structure, run `npm run test:parsers` to verify test failure (files missing).
4. [x] Write code and run green: Create `.vscode/launch.json` and `.vscode/tasks.json` with standard VS Code extension development host settings and npm compile task, re-run `npm run test:parsers` and `npm test` to verify green.

### 2. Documentation & memory bank — prose/policy

- Files: `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. [x] Update `memory-bank/techContext.md` to note the committed `.vscode/launch.json` and `tasks.json` configurations for F5 debugging.

## Technology Validation

No new technology - validation not required (uses standard VS Code configuration schemas).

## Dependencies

- VS Code Extension Development Host (`extensionHost` type)
- npm script `compile` defined in `package.json`

## Challenges & Mitigations

- Challenge: `tasks.json` task matching by `preLaunchTask: "npm: compile"` vs explicit label `npm: compile`.
  Mitigation: Define explicit `label: "npm: compile"` in `tasks.json` with `type: "npm"` and `script: "compile"`, which is the standard cross-platform format recognized by VS Code.

## Pre-Mortem

- Likely cause if this plan failed: `launch.json` points to wrong outFiles or missing build artifact.
  How the plan changes: Explicitly set `"outFiles": ["${workspaceFolder}/dist/**/*.js"]` and verify `preLaunchTask: "npm: compile"` creates `dist/extension.js`.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
