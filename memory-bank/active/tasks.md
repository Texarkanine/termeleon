# Task: changelog-release-please

* Task ID: changelog-release-please
* Complexity: Level 2
* Type: simple enhancement

Add CHANGELOG.md, release-please config/manifest, and a GitHub Actions workflow so main can cut tagged releases from conventional commits. Follow tab-yeet's node `release-type`. Do not add AMO, Chrome Web Store, or VS Marketplace publish jobs.

## Test Plan (TDD)

### Behaviors to Verify

No new executable behavior. This work is release-process config, a changelog bootstrap, and a GitHub Actions workflow. Those are prose/policy artifacts. Do not invent change-detectors that assert on file contents.

Existing parser tests in `test/parsers.test.ts` must still pass after the change (no product code is touched; this is a regression check at the end of build, not a new behavior).

### Test Infrastructure

- Framework: Node `assert` via `tsx` (`npm run test:parsers`)
- Test location: `test/parsers.test.ts` and `test/fixtures/`
- Conventions: one harness file, fixtures on disk, no extension host
- New test files: none

## Implementation Plan

### 1. Bootstrap CHANGELOG.md — prose/policy

- Files: `CHANGELOG.md`
- No tests: prose/policy artifact

1. [x] Create `CHANGELOG.md` with heading `# Changelog` only (sibling bootstrap; release-please appends version sections on release PRs).
2. [x] Do not add SPDX comments (markdown is licensed via root LICENSE only).

### 2. release-please config and manifest — prose/policy

- Files: `release-please-config.json`, `.release-please-manifest.json`
- No tests: prose/policy artifact

1. [x] Add `release-please-config.json` for a single root package:
    - `"release-type": "node"` on `packages["."]` (tab-yeet; no VS Code exception — vsce reads `package.json` `version`, which node type already bumps).
    - No `extra-files` (tab-yeet lists `manifest.json` for the browser extension; this repo has no second version field).
    - `"pull-request-header": ":service_dog: I have created a release \\*bark\\* \\*woof\\"` (sibling house style).
    - Top-level `"bump-minor-pre-major": true` and `"bump-patch-for-minor-pre-major": false` (0.x siblings stockroom/SumMem/slobac/a16n; package is `0.1.0` so a `feat` must not jump to `1.0.0`).
    - `"include-component-in-tag": false` (single-package siblings; tags `v0.x.y`, not `terminal-theme-import-v0.x.y`).
    - `$schema` pointing at googleapis/release-please config schema (a16n style; optional but keeps editors honest).
2. [x] Add `.release-please-manifest.json` as `{ ".": "0.1.0" }` matching current `package.json` `version`. Do not bump `package.json` in this task — release-please owns later bumps.

### 3. Release Please workflow — prose/policy

- Files: `.github/workflows/release-please.yaml`
- No tests: prose/policy artifact

1. [x] Create `.github/workflows/release-please.yaml` with only the `release-please` job (copy the helper-app + action shape from stockroom/SumMem/tab-yeet; omit tab-yeet `build-release` / AMO / CWS jobs entirely).
2. [x] Trigger: `push` to `main`. Permissions: `contents: write`, `pull-requests: write`, `issues: write`. Concurrency group per workflow+ref, `cancel-in-progress: false`.
3. [x] Token: `actions/create-github-app-token@v3` with `client-id: ${{ vars.HELPER_APP_ID }}` and `private-key: ${{ secrets.HELPER_APP_PRIVATE_KEY }}` (tab-yeet's helper-app pattern; do not invent secrets; do not use `DOGGO_BOT_*`).
4. [x] Run `googleapis/release-please-action@v5` with that token, `config-file: release-please-config.json`, `manifest-file: .release-please-manifest.json`.
5. [x] Comment that a GitHub App token is used so the release PR triggers CI, and that `HELPER_APP_ID` / `HELPER_APP_PRIVATE_KEY` are org-level (already used by siblings), not Marketplace publisher credentials.

### 4. Keep release files out of the VSIX — prose/policy

- Files: `.vscodeignore`
- No tests: prose/policy artifact

1. [x] Append ignore entries for `.github/**`, `release-please-config.json`, and `.release-please-manifest.json` so vsce does not ship CI/config in the VSIX. Leave existing ignore lines alone. Do not start ignoring `CHANGELOG.md` (fine in the package).

### 5. Record how releases work — prose/policy

- Files: `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. [x] Add a short Releases subsection: tagged GitHub releases come from conventional commits on `main` via release-please; the bumped version is `package.json` `version`; there is no Marketplace/AMO/CWS publish job.

### 6. Close the issue from the implementation commit — prose/policy

- Files: (commit message only)
- No tests: prose/policy artifact

1. [x] The build-phase implementation commit that adds the files above includes `Fixes #7` in the body. Niko `chore: saving work before …` commits do not.

## Technology Validation

No new runtime, build, or npm dependency. release-please runs in GitHub Actions using an existing org helper app. Validation not required beyond matching sibling YAML/JSON that already runs on Texarkanine repos.

## Dependencies

- Org GitHub App vars/secrets `HELPER_APP_ID` and `HELPER_APP_PRIVATE_KEY` (already used by tab-yeet and stockroom). This task does not provision them.
- Default branch `main` (workflow only runs after work lands there). Current development branch is `initialdev`; that is expected.

## Challenges & Mitigations

- **HELPER_APP_ID as `client-id` vs `app-id`:** tab-yeet uses `client-id`; stockroom and slobac use `app-id` with the same var name. Mitigation: follow tab-yeet (the issue's named sibling, and the node `release-type` source). If org `HELPER_APP_ID` is numeric-only, the first run on main will fail token minting and the fix is one-line (`app-id`). Do not invent a second secret.
- **0.x bump policy:** tab-yeet's config omits `bump-minor-pre-major`; other 0.x siblings set it true. Mitigation: set it true and document it as 0.x house style, not a VS Code exception.
- **Parallel issue-3 (GitHub Actions CI):** another worktree may add `.github/workflows/`. Mitigation: add only `release-please.yaml`; do not rewrite a shared CI file.
- **First changelog dump:** with no prior tag, the first release PR may list every conventional commit since the initial snapshot. Mitigation: accept default bootstrap; do not set `bootstrap-sha` unless the operator asks (taste).

## Pre-Mortem

- **Copied tab-yeet's publish jobs by habit:** already covered by Challenge (plan unit 3 forbids AMO/CWS/VSIX attach). Done-when is config + workflow + CHANGELOG + package version bump target only.
- **Used `simple` release-type because some siblings do:** would fail the issue's "follow tab-yeet node unless exception" rule. Plan unit 2 locks `node` and documents why no exception.
- **Invented Marketplace publish or new secrets:** already excluded by constraints and unit 3.
- **Wrote a CHANGELOG-contents test:** would be a change-detector. Test plan explicitly has no new tests.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA

## QA Results

**Result:** PASS

- The committed release-please configuration, manifest, workflow, VSIX ignore rules, changelog bootstrap, and release documentation match the approved plan.
- The workflow has only the release-please job, uses the approved helper-app token pattern, and adds no Marketplace, AMO, or Chrome Web Store publishing.
- The `Fixes #7` checklist item was verified against implementation commit `cabf8aa`. It is correctly marked complete.
