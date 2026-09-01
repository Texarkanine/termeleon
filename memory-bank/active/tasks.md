# Task: packaging-icon

* Task ID: packaging-icon
* Complexity: Level 2
* Type: simple enhancement

Add committed extension marketplace icon, configure `package.json` with `icon` path, verify `publisher` is `texarkanine`, ensure VSIX inclusion via `.vscodeignore`, and lock packaging contracts into `test/parsers.test.ts` without brittle change-detector assertions.

## Test Plan (TDD)

### Behaviors to Verify

- [Package Icon Contract]: `package.json` specifies an `icon` property pointing to a file path within the repository; that file exists on disk, is a non-empty file, and is not excluded by `.vscodeignore`.
- [Package Publisher Contract]: `package.json` specifies `"publisher": "texarkanine"`.
- [Packaging Verification]: `npm run package` (`vsce package`) executes without errors or missing publisher/icon warnings and produces a valid VSIX.

### Test Infrastructure

- Framework: Node assert / tsx runner
- Test location: `test/parsers.test.ts`
- Conventions: `test('description', () => { ... })` harness with Node assertions
- New test files: none (extend contract tests in `test/parsers.test.ts`)

## Implementation Plan

### 1. Package icon asset and manifest contract — executable

- Files: `images/icon.png`, `package.json`, `test/parsers.test.ts`

1. Stub tests: Add empty test stub `package.json icon and publisher contract` in `test/parsers.test.ts`.
2. Stub interface: Add `icon?: string` and `publisher?: string` fields to `package.json` type shape in `test/parsers.test.ts`.
3. Write tests and run red: Implement assertions in `test/parsers.test.ts` checking `pkg.icon`, `pkg.publisher === 'texarkanine'`, existence of `path.join(repoRoot, pkg.icon)` as a non-empty file, and verifying `.vscodeignore` does not ignore the icon path. Run `npm run test:parsers` to see the test fail (red).
4. Write code and run green: Generate `images/icon.png` (256x256 square transparent PNG derived from `.scratch/termeleon-logo-1024.png`), add `"icon": "images/icon.png"` to `package.json`, and run `npm run test:parsers` to verify all tests pass (green).

### 2. VSIX packaging and test suite verification — executable

- Files: `.vscodeignore`, `package.json`

1. Stub tests: N/A (covered by build and packaging pipeline).
2. Stub interface: N/A.
3. Write tests and run red: N/A.
4. Write code and run green: Run `npm run compile`, `npm run test:coverage`, and `npm run package` (`vsce package --no-dependencies`) to verify clean VSIX packaging with the icon included.

## Technology Validation

No new runtime or build dependencies required. Asset generation uses macOS image rendering tools to output a clean 256x256 square transparent PNG.

## Dependencies

- None (uses existing project toolchain: `esbuild`, `tsx`, `@vscode/vsce`, `c8`).

## Challenges & Mitigations

- [Challenge 1]: Preventing brittle change-detector tests.
  Mitigation: Assert only on manifest property existence, file existence, non-zero file size, and `.vscodeignore` non-exclusion. Do not assert on image checksums, exact byte sizes, or pixel values.
- [Challenge 2]: Ensuring icon dimensions and transparency match VS Code extension guidelines.
  Mitigation: Generate a 256x256 Retina-ready square PNG with transparent padding preserving the full chameleon illustration.

## Pre-Mortem

- [Likely cause if this plan failed]: `.vscodeignore` might inadvertently exclude the image directory or file extension during packaging.
  Mitigation: Contract test in `test/parsers.test.ts` verifies `.vscodeignore` does not ignore the icon path, and `npm run package` validates VSIX assembly directly.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
