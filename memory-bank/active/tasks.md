# Current Task: clean-up-empty-workspace-settings

**Complexity:** Level 1

## Fix Summary
- **What broke:** When removing an applied palette or canceling live preview in a workspace that had no settings beforehand, VS Code's settings API cleared the keys but left `.vscode/settings.json` containing an empty JSON object `{}` and kept the `.vscode/` folder on disk.
- **Why:** VS Code's configuration service updates keys inside `.vscode/settings.json` and does not delete the JSON file or directory when emptied.
- **What changed:**
  - Added `cleanEmptyWorkspaceSettings` helper in `src/apply.ts`:
    - Checks workspace folders when `target === 'workspace'`.
    - If `.vscode/settings.json` exists and parses to an empty object `{}` (and no other configuration), it is deleted.
    - If `.vscode/` has no remaining configuration files (ignoring `.DS_Store`), the directory is removed.
    - Preserves `.vscode/settings.json` if other settings exist and preserves `.vscode/` if other files exist.
    - Wrapped in try/catch to ensure filesystem errors never interrupt settings operations.
  - Invoked `cleanEmptyWorkspaceSettings` in `removeApplied` and `restoreApply` when `target === 'workspace'`.
  - Added TDD host tests in `test/host/apply.test.ts` and `test/host/preview.test.ts`.
- **Files affected:**
  - `src/apply.ts`
  - `test/host/apply.test.ts`
  - `test/host/preview.test.ts`

## QA Results - PASS (2026-08-31)
- Semantic review against plan: all requirements, use-cases, and constraints satisfied; no KISS/DRY/YAGNI/completeness/regression/integrity violations.
- Advisories (non-blocking): `{}` fast-path redundant with JSON.parse branch; helper exported though only exercised via `removeApplied`/`LivePreview.cancel`.
- Mechanical re-verification: 45 parser + 5 discovery tests green; `tsc --noEmit` green for src and tests; 30 host tests green from build phase.
