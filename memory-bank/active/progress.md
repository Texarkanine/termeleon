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
