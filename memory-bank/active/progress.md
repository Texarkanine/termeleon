# Progress

Add GitHub Actions CI that runs `npm ci`, `npm run test:parsers`, and `npm run compile` on pull requests and pushes to `main`, matching other Texarkanine Node repos (tab-yeet / a16n) without REUSE, Codecov, or vsce.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed persistent memory bank exists; ephemeral `memory-bank/active/` was empty (fresh standalone).
    - Fetched issue #3 and sibling workflows (tab-yeet npm CI, a16n pnpm CI).
    - Classified Level 2 (simple enhancement, self-contained repo-tooling change).
* Decisions made
    - Intent restatement is issue #3 itself; operator already approved, so no wait.
    - Closest shape is tab-yeet: `actions/checkout@v7`, `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`, then `npm ci`, then this repo's scripts.
* Insights
    - Tree has no `.github/`, no `.nvmrc`, and no `package-lock.json`.
    - `techContext.md` still says there is no lockfile; that must be updated when the lockfile is committed.
    - README Development already documents `npm install` / `test:parsers` / `compile`; after a lockfile, `npm ci` is the local equivalent of CI.

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 implementation plan in `tasks.md`: CI contract tests in the existing harness, then `.nvmrc` / lockfile / `ci.yaml`, then README and techContext.
* Decisions made
    - Node pin is major `22` (tab-yeet style; this machine's nvm default is 22.x).
    - Workflow shape is tab-yeet minus coverage/Codecov and minus this repo's out-of-scope jobs; scripts are `test:parsers` then `compile`.
    - Contract tests live in `test/parsers.test.ts` so `npm run test:parsers` stays the CI test command.
    - No new npm dependencies; no YAML parser.
* Insights
    - Preflight will treat the workflow as executable because it is a workflow CI runs; encoding TDD as a cross-file contract (not YAML wording) is the always-tdd-legal path.

## 2026-08-31 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the plan against codebase reality: TDD encoding, conventions, dependency impact, conflicts, completeness.
    - Verified the live tab-yeet `ci.yaml` matches the plan's action versions and shape.
    - Wrote `memory-bank/active/.preflight-status`; first line: `PASS WITH ADVISORY`.
* Decisions made
    - No plan edits needed: no change-detector strikes, no TDD step swaps.
* Insights
    - Advisory: `.vscodeignore` does not exclude the new root files (`.github/`, `.nvmrc`, `package-lock.json`), so they would ship in a VSIX.
    - Advisory: a single `npm run ci` script would make "CI runs what contributors run" true by construction.

## 2026-08-31 - BUILD - COMPLETE

* Work completed
    - Contract tests in `test/parsers.test.ts` went red (missing lockfile/nvmrc/workflow) then green.
    - Added `.nvmrc` (`22`), tab-yeet-shaped `.github/workflows/ci.yaml`, committed `package-lock.json`.
    - Regenerated lockfile from a clean `node_modules` so all esbuild platform optional packages (including linux-x64) are present.
    - Updated README Development and `techContext.md`.
    - Local `npm run test:parsers` (14 passed) and `npm run compile` succeeded on Node 22.23.2.
    - Committed `feat(ci): run parser tests and compile on GitHub Actions` with `Fixes #3`.
* Decisions made
    - Did not add `.vscodeignore` entries or an `npm run ci` script (preflight advisories).
    - Lockfile must be generated with `node_modules` absent; generating with it present pruned non-darwin esbuild binaries.
* Insights
    - Rancher Docker CLI is installed but the daemon was not running, so linux `npm ci` was not container-verified; the lockfile now contains `@esbuild/linux-x64` and other platform entries.

## 2026-08-31 - QA - COMPLETE (PASS)

* Work completed
    - Reviewed the CI implementation against the approved Level 2 plan and project brief.
    - Verified the workflow triggers, Node pin, npm cache, installation, parser-test, and compile gates.
    - Re-ran `npm run test:parsers` (14 passed), `npm run compile`, and `git diff --check 15843eb..3ebec9f`.
* Decisions made
    - Accepted the implementation as-is; preflight's optional VSIX-hygiene and `npm run ci` suggestions remain out of scope.
* Findings
    - No blocking or advisory findings. The implementation is complete, minimal, and consistent with established repository patterns.

## 2026-08-31 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-github-actions-ci.md`.
    - Reconciled `techContext.md`: lockfile-from-clean-tree invariant; `.nvmrc` as pointer rather than a pinned major.
* Decisions made
    - productContext: skip — CI is not a product-user change.
    - systemPatterns: skip — CI contract tests are documented in techContext; no new architectural pattern.
    - Stop at REFLECT COMPLETE per operator; no archive, no PR.
* Insights
    - npm 10 lockfile generation with `node_modules` present is the load-bearing gotcha for linux CI.

## 2026-08-31 - PR REVIEW - IN-PROGRESS

* Work completed
    - discussion_r3896567069: workflow `pull_request` and `push` now list `initialdev` and `main`.
    - Contract test requires both branch names; README and `techContext.md` updated.
    - `npm run test:parsers` (14 passed) and `npm run compile` on Node 22.23.2.
* Decisions made
    - Do not replace `main` with only `initialdev`; keep both so CI runs on this repo now and still matches house shape when `main` exists.


