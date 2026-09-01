# Task: ci-openvsx-codecov

* Task ID: ci-openvsx-codecov
* Complexity: Level 2
* Type: simple enhancement

Configure Open VSX extension publishing on release-please release creation, integrate test coverage generation and CI upload to Codecov with status badge, and enforce workflow contracts in tests.

## Test Plan (TDD)

### Behaviors to Verify

- [CI Workflow Contract]: `.github/workflows/ci.yaml` runs test coverage (`test:coverage` or coverage step) and uploads to Codecov using `codecov/codecov-action@v7` with `secrets.CODECOV_TOKEN` and `fail_ci_if_error: false`.
- [Release Please Open VSX Contract]: `.github/workflows/release-please.yaml` includes an Open VSX publish step gated on `release_created` using `secrets.OPENVSX_TOKEN` and `ovsx publish`.
- [Marketplace Safety Contract]: `.github/workflows/release-please.yaml` does not publish to Visual Studio Marketplace (`!wf.includes('vsce publish')`, `!wf.includes('VSCE_PAT')`).
- [Coverage Script Contract]: `package.json` defines `test:coverage` script that generates lcov coverage reports.
- [Coverage Artifact Ignore Contract]: `.gitignore` and `.vscodeignore` ignore coverage output directories so they are not tracked in git or packaged in VSIX.
- [Readme Badge Contract]: `README.md` includes the Codecov badge for `Texarkanine/termeleon`.

### Test Infrastructure

- Framework: Node assert / tsx runner
- Test location: `test/parsers.test.ts`
- Conventions: `test('description', () => { ... })` harness with assertions
- New test files: none (extended existing CI contract section in `test/parsers.test.ts`)

## Implementation Plan

### 1. Test coverage script, packaging ignore, and lockfile — executable

- Files: `package.json`, `package-lock.json`, `.gitignore`, `.vscodeignore`, `test/parsers.test.ts`

1. Stub tests: Add empty test stubs in `test/parsers.test.ts` under the CI contract section for coverage script, coverage ignore in `.gitignore` and `.vscodeignore`, Codecov upload in `ci.yaml`, and Open VSX in `release-please.yaml`.
2. Stub interface: Add placeholder `test:coverage` script in `package.json`.
3. Write tests and run red: Implement assertions in `test/parsers.test.ts` (including `.gitignore` and `.vscodeignore` checking for coverage ignore, and `package-lock.json` presence and lockfile integrity) and run `npm run test:parsers` to verify failure.
4. Write code and run green: Add `c8` devDependency and `test:coverage` script in `package.json`, add `coverage/**` to `.gitignore` and `.vscodeignore`, update `package-lock.json` ensuring clean-tree npm ci compatibility, and run `npm run test:parsers` until green.

### 2. CI & Release-Please GitHub Actions Workflows — executable

- Files: `.github/workflows/ci.yaml`, `.github/workflows/release-please.yaml`, `test/parsers.test.ts`

1. Stub tests: (Already stubbed in step 1).
2. Stub interface: N/A (workflow YAML configuration).
3. Write tests and run red: Run `test:parsers` to see workflow contract assertions fail against unedited workflow files.
4. Write code and run green: Update `.github/workflows/ci.yaml` with coverage execution and Codecov action step; update `.github/workflows/release-please.yaml` with Open VSX publish step. Run `npm run test:parsers` until green.

### 3. Readme badge and memory-bank context — prose/policy

- Files: `README.md`, `memory-bank/techContext.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. Add Codecov badge to `README.md` matching sibling repo conventions (`a16n`, `stockroom`).
2. Update `memory-bank/techContext.md` to document Open VSX publishing in releases and Codecov coverage in CI.
3. Update `memory-bank/active/activeContext.md` and `memory-bank/active/progress.md`.

## Technology Validation

Validated `c8` (v11/v12) coverage execution over `test/parsers.test.ts` and `test/discover.test.ts`, producing `coverage/lcov.info` cleanly with 94.57% statement coverage. Validated `ovsx publish` CLI options (`--pat` / `-p`).

## Dependencies

- `c8` devDependency for V8 test coverage generation
- `ovsx` (via npx in release workflow)
- `codecov/codecov-action@v7` GitHub Action

## Challenges & Mitigations

- [Challenge 1]: Package lockfile modification with npm 10 can strip multi-platform optional dependencies if node_modules already exists.
  Mitigation: Ensure clean `package-lock.json` or verify `npm ci` compatibility.
- [Challenge 2]: Secrets availability in CI.
  Mitigation: Use `secrets.CODECOV_TOKEN` and `secrets.OPENVSX_TOKEN`, with `fail_ci_if_error: false` on the Codecov action to prevent blocking CI on unprivileged fork PRs.

## Pre-Mortem

- [Likely cause if this plan failed]: Workflow contract tests might fail on minor whitespace or syntax mismatches in GitHub Actions YAML.
  Mitigation: Write robust regex/string assertions in `test/parsers.test.ts` matching the exact required actions and env vars.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
