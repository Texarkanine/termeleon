# Progress

Add an Extension Development Host test suite so apply, surgical remove, and live-preview cancel restore are proven. Parser tests stay vscode-free.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Ingested issue 6 and existing apply/picker code
    - Classified Level 2 (self-contained host-test enhancement)
* Decisions made
    - Skip waiting at intent clarification (operator already assigned the issue)
    - Do not classify Level 3: the work is one new test subsystem, and L3 would block the operator at Preflight PASS
* Insights
    - `apply.ts` is already a testable API in a host; the picker in `extension.ts` is not exported, so preview-cancel will need a small extraction or an export
    - Current recommended stack is `@vscode/test-cli` plus `@vscode/test-electron`

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 plan in `tasks.md` (harness scripts, apply/remove characterization, LivePreview TDD)
    - Installed `@vscode/test-cli`, `@vscode/test-electron`, `@types/mocha`
    - PoC: compiled host smoke test and ran `npx vscode-test` successfully (VS Code 1.135.0)
* Decisions made
    - Mocha TDD under `test/host/`, compiled via `tsconfig.test.json` to `out/`
    - Short `--user-data-dir` under `os.tmpdir()` so macOS socket paths fit
    - Extract `LivePreview` in `apply.ts`; do not automate the QuickPick
    - Characterization tests for existing apply/remove (expect green); TDD only for `LivePreview`
    - Commit `package-lock.json` for runner reproducibility
* Insights
    - Default `.vscode-test/user-data` is unusable in this worktree path (103-char socket limit)
    - `extensionDevelopmentPath` still loads this extension when `--disable-extensions` is set
