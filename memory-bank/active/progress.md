# Progress

Assess the three `npm audit` findings (`diff` via mocha, `serialize-javascript` via mocha) and apply only the remediations that are safe, leaving the rest as cannot/should-not.

**Complexity:** Level 1

## 2026-09-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified as Level 1 Quick Bug Fix
    - Wrote project brief, active context, and task stub
* Decisions made
    - Single-component error correction of the mocha / `@vscode/test-cli` audit tree; no architectural change
* Insights
    - mocha is not a direct dependency; both vulnerable packages sit under mocha, which sits under `@vscode/test-cli`

## 2026-09-13 - BUILD - COMPLETE

* Work completed
    - Restored `@vscode/test-cli` to `^0.0.15` (working-tree downgrade to 0.0.11 does not clear the audit)
    - Added mocha-scoped `overrides` for `diff@^8.0.3` and `serialize-javascript@^7.0.5`
    - Refreshed lockfile from a clean tree; resolved `diff@8.0.4` and `serialize-javascript@7.1.1`
    - `npm audit` reports 0 vulnerabilities
    - Parser suite passed; host suite passed (47)
* Decisions made
    - Leaf overrides over a mocha 12 force: `@vscode/test-cli@0.0.15` still depends on mocha 11
    - mocha uses `diff.createPatch` / `diffWordsWithSpace` and `serialize-javascript` for worker IPC, not `parsePatch` / `applyPatch`
* Insights
    - `npm audit fix` is a no-op here: mocha 11's ranges cannot reach the patched majors
    - Host tests on this WSL box fail if `XDG_RUNTIME_DIR=/run/user/1000` is missing; pointing it at a tmpdir is an environment workaround, not a product change
