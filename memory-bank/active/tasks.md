# Task: marketplace-store-readme

* Task ID: marketplace-store-readme
* Complexity: Level 2
* Type: simple enhancement

Create dedicated user-facing sales pitch in `STORE.md` for extension marketplace listings, configure `package.json` to package it via `vsce package --readme-path STORE.md`, exclude developer `README.md` in `.vscodeignore`, and enforce packaging contracts in `test/parsers.test.ts`.

## Test Plan (TDD)

### Behaviors to Verify

- [x] [Store Readme Packaging Contract]: `package.json`'s `package` script invokes `vsce package` with `--readme-path STORE.md`; `STORE.md` exists on disk and is a non-empty markdown file.
- [x] [VSIX Ignore Separation Contract]: `.vscodeignore` ignores `README.md` (to prevent duplicate root readme packaging and case collisions) and does not ignore `STORE.md`.
- [x] [Icon & Publisher Contract]: `package.json` specifies `"publisher": "texarkanine"` and `"icon": "images/icon.png"`; `images/icon.png` exists on disk, is a valid PNG (PNG signature `89 50 4E 47 0D 0A 1A 0A`), and is not ignored by `.vscodeignore`.

### Test Infrastructure

- Framework: Node assert / tsx runner
- Test location: `test/parsers.test.ts`
- Conventions: `test('description', () => { ... })` harness with Node assertions
- New test files: none (extend contract tests in `test/parsers.test.ts`)

## Implementation Plan

### 1. Store sales pitch, packaging script, and ignore contract — executable

- Files: `STORE.md`, `package.json`, `.vscodeignore`, `test/parsers.test.ts`

1. Stub tests: Add empty test stubs in `test/parsers.test.ts` for store readme packaging script contract and ignore separation. [Completed]
2. Stub interface: N/A (manifest and file contracts). [Completed]
3. Write tests and run red: Implement assertions in `test/parsers.test.ts` checking:
   - `pkg.scripts.package` contains `--readme-path STORE.md`
   - `STORE.md` exists on disk and `statSync(storePath).size > 0`
   - `.vscodeignore` includes `README.md`
   - `.vscodeignore` does not include `STORE.md`
   Run `npm run test:parsers` to verify test fails (red). [Completed]
4. Write code and run green:
   - Create `STORE.md` with user-facing features, commands, supported emulators, and configuration guides without internal developer instructions. [Completed]
   - Update `package.json` `"package"` script to `"vsce package --no-dependencies --readme-path STORE.md"`. [Completed]
   - Add `README.md` to `.vscodeignore`. [Completed]
   - Run `npm run test:parsers` to verify all parser tests pass (green). [Completed]
5. Post-green acceptance verification:
   - Run `npm run compile` to confirm clean typecheck and bundle. [Completed]
   - Run `npm run test:coverage` and `npm run test:host` to verify full test suites pass. [Completed]
   - Run `npm run package` and inspect VSIX archive contents to verify `extension/readme.md` is populated from `STORE.md` and `extension/images/icon.png` is included. [Completed]

## Technology Validation

No new runtime or build dependencies required. `@vscode/vsce` natively supports `--readme-path <path>`.

## Dependencies

- None (uses existing project toolchain: `esbuild`, `tsx`, `@vscode/vsce`, `c8`).

## Challenges & Mitigations

- [Challenge 1]: Case-insensitive collision in VSIX zip archive if both `README.md` and `STORE.md` are packaged.
  Mitigation: Explicitly add `README.md` to `.vscodeignore` so `vsce` only packages `STORE.md` into `extension/readme.md`.
- [Challenge 2]: Ensuring `STORE.md` is complete and clear for end users without dragging developer build instructions into the marketplace.
  Mitigation: Focus `STORE.md` on value propositions, commands, emulator matrix, live preview, and configuration options.

## Pre-Mortem

- [Likely cause if this plan failed]: `vsce package` could fail if `--readme-path` path resolution differs between platforms.
  Mitigation: Use workspace-relative path `STORE.md`, tested directly with `npm run package`.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA — PASS: Build updated `memory-bank/techContext.md` to accurately describe `vsce package --no-dependencies --readme-path STORE.md` and STORE.md's role. KISS, DRY, YAGNI, completeness, regression, integrity, and documentation all pass; `npm test` passed (59 parser/discover and 30 host tests).
