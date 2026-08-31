# Progress

Attach a packaged `.vsix` to GitHub Releases cut by release-please, add a local package command, and document the typical sideload/development loop. Feature branch off `initialdev`. No Marketplace publish.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Validated intent: VSIX on GitHub Releases, local package command, document the development loop, branch off `initialdev`
    - Classified as Level 2 (self-contained release/packaging enhancement)
* Decisions made
    - Level 2: not a bug fix; not Marketplace or a new release architecture
    - Feature branch `feat/vsix-github-releases`
* Insights
    - release-please-action does not attach files; a follow-on job gated on `release_created` is the usual shape
    - `vsce package` needs a `publisher` field even when not publishing to Marketplace

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 implementation plan: CI contract tests, vsce + package script, release-please VSIX upload, README/techContext
    - Validated `@vscode/vsce` via npx → 3.9.2
* Decisions made
    - Publisher `texarkanine` for packaging only
    - `vsce package --no-dependencies` with `prepackage` compile
    - Same-job follow-on gated on `steps.release.outputs.release_created`
    - Add `npm run package` to PR CI (pre-mortem)
    - Document sideload; do not add launch.json
* Insights
    - Job currently never checkouts; upload path must add checkout + Node
    - `*.vsix` already gitignored

## 2026-08-31 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the plan against codebase reality: TDD ordering, conventions, dependency impact, conflicts, completeness
    - Verified plan's factual claims (`.gitignore`, `.vscodeignore`, `ci` test section, README Development section, package.json clean slate)
* Decisions made
    - Result: PASS WITH ADVISORY (first line of `.preflight-status`)
    - Kept the negative "no Marketplace publish" workflow assertion: judged a policy gate on executable config, not a prose change-detector
* Insights
    - Advisory: upload the CI-built `.vsix` as a workflow artifact so every PR is sideload-installable
    - Advisory: CI will compile twice (explicit step + `prepackage`); harmless redundancy

## 2026-08-31 - BUILD - COMPLETE

* Work completed
    - Contract tests in `test/parsers.test.ts` `ci` section; `@vscode/vsce` ^3.9.2; `publisher` + `package` script; CI `npm run package`; release-please upload
    - README development loop; techContext Releases/CI
    - Full suite: parsers 45 + discover 5; host 18 passing
    - Local VSIX is `dist/extension.js` plus README/LICENSE/CHANGELOG/package.json
* Decisions made
    - `.vscodeignore` also excludes `.cursor/**`, `.summem/**`, `memory-bank/**`, agent markdown
    - Negative Marketplace test is `vsce publish` / `VSCE_PAT`, not the word Marketplace
* Insights
    - Default vsce include list is "everything not ignored"; agent trees must be named in `.vscodeignore`

## 2026-08-31 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-vsix-github-releases.md`
    - Reconciled persistent files
* Decisions made
    - productContext: skip — maintainer packaging, not a user-facing product change
    - systemPatterns: skip — no change to the vscode-free core / apply contract
    - techContext: skip — already updated in build (package script, CI package, VSIX attach, ignore list)
* Insights
    - Read the vsce included-files tree during build; ignore-list string tests miss what actually packs

## 2026-08-31 - QA - COMPLETE

* Work completed
    - Reviewed the full `initialdev..HEAD` diff against the plan and brief for KISS/DRY/YAGNI/completeness/regression/integrity/documentation
    - Re-ran `npm run test:parsers` (45 + 5 passed) and a real `npm run package` to confirm the VSIX excludes agent/memory-bank trees
* Decisions made
    - Result: PASS, no rework required
* Insights
    - Pre-mortem mitigation (clean-tree install before adding vsce) held: linux esbuild optionals are still in the lockfile
