# Progress

Add CHANGELOG.md and release-please (config + workflow) so main can cut tagged releases from conventional commits, following sibling Texarkanine node release-type unless a VS Code extension needs a documented exception. Do not add Marketplace/AMO/CWS publish jobs.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed persistent memory-bank files exist; initialized ephemeral files for issue #7.
    - Classified Level 2 (simple enhancement): self-contained release plumbing, no product-architecture change.
* Decisions made
    - Operator pre-approved the issue as the task; skipped waiting at intent clarification.
    - Stay Level 2 rather than L3: design choice is "copy tab-yeet node type unless exception," which is research during plan, not a new architecture.
* Insights
    - This worktree has no `.github/` yet and `package.json` is at `0.1.0`.

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Compared tab-yeet, stockroom, SumMem, slobac, and a16n release-please configs/workflows.
    - Wrote Level 2 plan: CHANGELOG bootstrap, node release-type config, helper-app workflow only, vscodeignore, techContext note.
* Decisions made
    - No VS Code exception: `release-type: node` because vsce already uses `package.json` version.
    - Omit tab-yeet `extra-files` / AMO / CWS / VSIX attach jobs.
    - Token: `vars.HELPER_APP_ID` as `client-id` and `secrets.HELPER_APP_PRIVATE_KEY` (tab-yeet).
    - `bump-minor-pre-major: true` from 0.x siblings so feat does not jump 0.1.0 → 1.0.0.
    - `include-component-in-tag: false` so tags are `v0.x.y`.
    - No new tests (prose/policy; no change-detectors).
* Insights
    - Siblings disagree on `app-id` vs `client-id` for the same HELPER_APP_ID var; first main run is the real check.
    - Parallel issue-3 may also add `.github/workflows/`; this task adds only `release-please.yaml`.

## 2026-08-31 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated the plan against the worktree and the real sibling repos (tab-yeet via GitHub API; stockroom, SumMem, a16n locally).
    - Result: `PASS WITH ADVISORY` (first line of `memory-bank/active/.preflight-status`).
* Decisions made
    - TDD check passes: all six units are prose/policy/config artifacts with no scheduled change-detectors; no plan edits were needed.
    - Plan's tab-yeet claims verified verbatim (node release-type, pull-request-header, `client-id` helper-app token, action v5).
* Insights
    - Advisory: a `build-vsix` job attaching the .vsix to the GitHub Release would make releases distributable without a Marketplace publisher.
    - Advisory: no `package-lock.json` exists, so any future CI build job cannot use `npm ci` until one is committed.

## 2026-08-31 - BUILD - COMPLETE

* Work completed
    - Added CHANGELOG.md, release-please config/manifest, and `.github/workflows/release-please.yaml` (helper-app token, no publish jobs).
    - Updated `.vscodeignore` and `memory-bank/techContext.md`.
    - Commit `cabf8aa` (`chore: add CHANGELOG and release-please`) includes `Fixes #7`.
    - `npm run test:parsers`: 11 passed. `npm run compile`: succeeded.
* Decisions made
    - Left preflight advisories out of scope (no VSIX attach, no package-lock.json).
    - Deleted the `package-lock.json` that `npm install` created in this worktree so it would not be committed.
* Insights
    - `package.json` remains `0.1.0`; release-please will bump it on main.

## 2026-08-31 - QA - COMPLETE (PASS)

* Work completed
    - Reviewed implementation commit `cabf8aa` against the approved Level 2 plan and acceptance criteria.
    - Verified the release-please config, manifest, workflow, VSIX ignore rules, changelog, release documentation, and issue-closing commit trailer.
* Decisions made
    - PASS: no build or plan changes are required.
* Insights
    - The workflow is deliberately release-please-only; it introduces no Marketplace, AMO, Chrome Web Store, or VSIX publishing job.
