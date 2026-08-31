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
