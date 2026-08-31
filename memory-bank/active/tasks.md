# Task: vsix-github-releases

* Task ID: vsix-github-releases
* Complexity: Level 2
* Type: simple enhancement

When release-please cuts a tagged GitHub Release, attach a built `.vsix`. Pin `@vscode/vsce`, add a local `package` script, and document the sideload loop in the README. Feature branch `feat/vsix-github-releases` off `initialdev`. No Marketplace publish.

## Test Plan (TDD)

### Behaviors to Verify

- Publisher present: `package.json` is read → `publisher` is a non-empty string (`vsce package` will not fail for a missing publisher)
- Package script: `package.json` `scripts.package` → invokes `vsce package` (local command for sideload)
- vsce pinned: `package.json` `devDependencies` → `@vscode/vsce` is listed so `npm ci` installs it
- Release attach: `.github/workflows/release-please.yaml` is read → the release-please step has an `id`, a later step is gated on `release_created`, and that path runs `gh release upload` of a `.vsix`
- No Marketplace publish: the same workflow → does not contain `vsce publish` or Marketplace publish actions
- PR packaging smoke: `.github/workflows/ci.yaml` is read → runs the local package command after compile so a broken `vsce`/`.vscodeignore`/`publisher` fails the PR, not the first tag

### Test Infrastructure

- Framework: Node `assert` harness via `tsx` (`test:parsers`)
- Test location: `test/parsers.test.ts` (`ci` section) — same contract-lock pattern as the existing workflow tests
- Conventions: `test('…')` with `fs.readFileSync` / `JSON.parse` of repo files; no new runner
- New test files: none

## Implementation Plan

### 1. Release and package contract — executable

- Files: `test/parsers.test.ts`, `package.json`, `package-lock.json`, `.github/workflows/release-please.yaml`, `.github/workflows/ci.yaml`

1. Stub tests: in the `ci` section of `test/parsers.test.ts`, add empty cases: publisher present; `scripts.package` invokes vsce; `@vscode/vsce` in `devDependencies`; release-please workflow attaches a `.vsix` on `release_created`; workflow has no Marketplace publish; CI runs the package script.
2. Stub interface: add `publisher` (empty string), `scripts.package` / `scripts.prepackage` placeholders, and `@vscode/vsce` in `devDependencies` without a working workflow yet — only enough for signatures to exist if tests import them; prefer leaving production files untouched until red if stubs would make tests pass early.
3. Write tests and run red: `npm run test:parsers`
    - `publisher` matches `/^[a-z0-9][a-z0-9-]*$/` and is non-empty
    - `scripts.package` includes `vsce package`
    - `devDependencies['@vscode/vsce']` is set
    - release-please.yaml: `id:` on the release-please step, `release_created`, `gh release upload`, `.vsix`
    - release-please.yaml does not include `vsce publish` or `marketplace`
    - ci.yaml includes `npm run package`
4. Write code and run green:
    - Set `publisher` to `texarkanine` (GitHub org; GitHub-only, not a Marketplace login)
    - Add `"prepackage": "npm run compile"` and `"package": "vsce package --no-dependencies"` (`node_modules` already ignored; the extension is esbuild-bundled)
    - `npm install --save-dev @vscode/vsce` from a **clean tree** (no `node_modules`) so linux esbuild optionals stay in the lockfile
    - Give the release-please action `id: release`; add a follow-on step `if: ${{ steps.release.outputs.release_created }}` that checkouts is already implied by needing sources: **same job**, after the action: checkout, `setup-node` with `.nvmrc` + npm cache, `npm ci`, `npm run package`, `gh release upload ${{ steps.release.outputs.tag_name }} *.vsix` using the helper-app token already minted (not Marketplace secrets)
    - Add `npm run package` to `ci.yaml` after compile

### 2. Document sideload loop and tech context — prose/policy

- Files: `README.md`, `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. Expand README Development: local `npm run package` → `terminal-theme-import-<version>.vsix` → Install from VSIX / `code --install-extension` / `cursor --install-extension`. Distinguish that from `npm run test:host` (throwaway VS Code, not the daily app). Mention `npm run compile` / `test:parsers` as the iterate loop. Do not add Marketplace publish steps. Do not add `.vscode/launch.json` (issue #4 is a separate F5-picker task).
2. Surgically update `techContext.md` Releases: follow-on job attaches a VSIX; `@vscode/vsce` is a pinned packager; still no Marketplace/AMO/CWS publish. CI now also runs `npm run package`.

## Technology Validation

New dependency: `@vscode/vsce`. Proof-of-concept: `npx --yes @vscode/vsce --version` → `3.9.2`. `*.vsix` is already in `.gitignore`. `.vscodeignore` already excludes `src/`, tests, `.github/`, and `node_modules/**`.

## Dependencies

- `@vscode/vsce` (devDependency; pin whatever `npm install` resolves, expected 3.x from the PoC)
- Existing helper-app token for `gh release upload`
- Existing `googleapis/release-please-action@v5` outputs `release_created` and `tag_name`

## Challenges & Mitigations

- Same-job checkout after release-please: the current job never checkouts the repo. Mitigation: add `actions/checkout` (and Node setup) only inside the `if: release_created` step group, or as steps all gated with that `if`.
- Helper-app vs `GITHUB_TOKEN` for upload: the release is created with the app token. Mitigation: pass the same generated token as `GH_TOKEN` / `GITHUB_TOKEN` for `gh release upload`.
- Lockfile esbuild prune: adding vsce with `node_modules` present can drop linux optional packages. Mitigation: install from a clean tree as in techContext.
- Publisher string vs issue #8: Marketplace id is still human-owned. Mitigation: use `texarkanine` for packaging only; do not add publish jobs.

## Pre-Mortem

- First GitHub Release has no VSIX because `release_created` was never wired (wrong output name or missing `id`). Plan already asserts those strings in the contract test; use `steps.release.outputs.release_created` per the action docs, not `releases_created` for this single-package repo.
- First tag is the first time `vsce package` runs and it fails. Plan response: CI `npm run package` (already in Test Plan / step 1).
- VSIX is empty of `dist/extension.js` because package ran without compile. Mitigation: `prepackage` runs `compile`.
- Upload cannot see the release created by the app token. Mitigation: reuse the app token (Challenge above).

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
