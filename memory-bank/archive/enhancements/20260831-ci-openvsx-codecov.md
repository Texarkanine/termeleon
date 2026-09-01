---
task_id: ci-openvsx-codecov
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: ci-openvsx-codecov

## SUMMARY

Configured automated Open VSX extension publishing in `.github/workflows/release-please.yaml` on release creation with `secrets.OPENVSX_TOKEN`, integrated `c8` test coverage generation and CI upload to Codecov via `secrets.CODECOV_TOKEN` in `.github/workflows/ci.yaml`, added the Codecov status badge to `README.md`, and enforced the workflow and ignore contracts in `test/parsers.test.ts`.

## REQUIREMENTS

- Create and work on a dedicated feature branch (`feat/ci-openvsx-codecov`).
- Update `.github/workflows/release-please.yaml` to publish the packaged VSIX to Open VSX using `secrets.OPENVSX_TOKEN` when a release is created.
- Configure test coverage generation via `c8` and add `test:coverage` script to `package.json`.
- Update `.github/workflows/ci.yaml` to run test coverage and upload reports to Codecov via `codecov/codecov-action@v7` using `secrets.CODECOV_TOKEN`.
- Add the Codecov status badge to `README.md` following sibling repository conventions.
- Update CI contract tests in `test/parsers.test.ts` and documentation in `memory-bank/techContext.md`.

## IMPLEMENTATION

1. `package.json` & `package-lock.json`: Added `c8` devDependency, `test:coverage` script, and regenerated lockfile ensuring clean-tree `npm ci` support.
2. `.gitignore` & `.vscodeignore`: Added `coverage/` to `.gitignore` and `coverage/**` to `.vscodeignore` so coverage artifacts are excluded from Git and VSIX packaging.
3. `.github/workflows/ci.yaml`: Updated parser testing to run with coverage and upload `coverage/lcov.info` to Codecov via `codecov/codecov-action@v7` with `fail_ci_if_error: false`.
4. `.github/workflows/release-please.yaml`: Added `publish-openvsx` deployment job targeting environment `open-vsx.org` using `npx --yes ovsx publish *.vsix --pat "$OPENVSX_TOKEN"` gated on `release_created`.
5. `test/parsers.test.ts`: Added contract assertions verifying `test:coverage` script presence, coverage ignore entries in `.gitignore` and `.vscodeignore`, Codecov action step in `ci.yaml`, and Open VSX publish step in `release-please.yaml`.
6. `README.md` & `memory-bank/techContext.md`: Added Codecov badge and updated development documentation and tech context.

Key files: `package.json`, `package-lock.json`, `.gitignore`, `.vscodeignore`, `.github/workflows/ci.yaml`, `.github/workflows/release-please.yaml`, `test/parsers.test.ts`, `README.md`, `memory-bank/techContext.md`.

## TESTING

- `npm run test:parsers`: 57/57 tests passed (including new coverage and workflow contract tests).
- `npm run test:coverage`: Generated `coverage/lcov.info` cleanly with 94.57% statement coverage.
- `npm run test:host`: 30/30 passed in Extension Development Host.
- `npm run compile`: Clean build with `tsc --noEmit` and `esbuild`.
- `npm run package`: Packaged clean VSIX without warnings.
- Preflight: Passed with advisory after updating lockfile and ignore assertions.
- QA: Passed full check across KISS, DRY, YAGNI, Completeness, Regression, and Integrity.

## LESSONS LEARNED

- Running `c8` wrapping `npm run test:parsers` captures multi-process `tsx` invocations cleanly and writes standard `coverage/lcov.info`.
- Using `npx --yes ovsx publish *.vsix --pat "$OPENVSX_TOKEN"` allows lightweight Open VSX publishing in CI without adding `ovsx` as a persistent dependency.
- Fast contract tests in `test/parsers.test.ts` prevent workflow and script drift without requiring live CI triggers.

## PROCESS IMPROVEMENTS

- Preflight validation effectively caught missing lockfile regeneration and `.gitignore` assertions before implementation began.

## TECHNICAL IMPROVEMENTS

- None. CI and release workflows are robustly locked with tests.

## NEXT STEPS

- None. PR #27 was merged and released in v0.3.0.
