# Task: packaging-icon

* Task ID: packaging-icon
* Complexity: Level 2
* Type: simple enhancement

Add committed extension marketplace icon, configure `package.json` with `icon` path, verify `publisher` is `texarkanine`, ensure VSIX inclusion via `.vscodeignore`, and lock packaging contracts into `test/parsers.test.ts` with valid image signature checks and no brittle change-detector assertions.

## Test Plan (TDD)

### Behaviors to Verify

- [Package Icon Contract]: `package.json` specifies `"publisher": "texarkanine"` and an `"icon"` property pointing to a repository path; that file exists on disk, is a non-empty valid PNG image (checked via PNG magic header `89 50 4E 47 0D 0A 1A 0A`), and is not excluded by `.vscodeignore`.

### Test Infrastructure

- Framework: Node assert / tsx runner
- Test location: `test/parsers.test.ts`
- Conventions: `test('description', () => { ... })` harness with Node assertions
- New test files: none (extend contract tests in `test/parsers.test.ts`)

## Implementation Plan

### 1. Package icon asset, manifest declaration, and ignore contract — executable

- Files: `images/icon.png`, `package.json`, `.vscodeignore`, `.gitignore`, `test/parsers.test.ts`

1. Stub tests: Add empty test stub `package.json icon and publisher contract` in `test/parsers.test.ts`.
2. Stub interface: Add `icon?: string` and `publisher?: string` fields to `package.json` type shape in `test/parsers.test.ts`.
3. Write tests and run red: Implement assertions in `test/parsers.test.ts` checking:
   - `pkg.publisher === 'texarkanine'`
   - `typeof pkg.icon === 'string'` and points to an existing file
   - The file at `path.join(repoRoot, pkg.icon)` is at least 8 bytes and starts with the standard PNG signature (`Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])`)
   - `.vscodeignore` does not exclude `pkg.icon` or `images/**`
   Run `npm run test:parsers` to verify test fails (red).
4. Write code and run green:
   - Generate `images/icon.png` as a 256x256 square transparent PNG derived from `.scratch/termeleon-logo-1024.png` using aspect-ratio-preserving transparent canvas padding (no clipping/distortion).
   - Add `"icon": "images/icon.png"` to `package.json`.
   - Run `npm run test:parsers` to verify all parser tests pass (green).
5. Post-green acceptance verification and workspace cleanup:
   - Run `npm run compile` to confirm clean typecheck and bundle.
   - Run `npm run test:coverage` and `npm run test:host` to verify full test suite passes.
   - Run `npm run package` (`vsce package`) to verify valid VSIX emission and inspect the package contents to verify `images/icon.png` is bundled.
   - Add `.scratch/` to `.gitignore` so local scratch assets stay untracked and clean.

## Technology Validation

No new runtime or build dependencies required. Asset generation uses macOS image rendering tools to output a clean 256x256 square transparent PNG.

## Dependencies

- None (uses existing project toolchain: `esbuild`, `tsx`, `@vscode/vsce`, `c8`).

## Challenges & Mitigations

- [Challenge 1]: Preventing brittle change-detector tests while verifying image validity.
  Mitigation: Assert on the standard 8-byte PNG file header (`0x89504E470D0A1A0A`) rather than pixel values or file checksums, so replacing the icon image with any valid PNG will never break the test.
- [Challenge 2]: Handling non-square source logo (1024x1130).
  Mitigation: Center and fit the source image inside a 256x256 square canvas with transparent background so the chameleon illustration remains uncropped and proportioned.

## Pre-Mortem

- [Likely cause if this plan failed]: `.vscodeignore` might inadvertently exclude the image directory or file extension during packaging.
  Mitigation: Contract test in `test/parsers.test.ts` verifies `.vscodeignore` does not ignore the icon path, and post-green step verifies VSIX contents.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
