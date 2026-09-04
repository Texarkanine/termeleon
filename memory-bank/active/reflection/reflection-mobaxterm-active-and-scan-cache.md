---
task_id: mobaxterm-active-and-scan-cache
date: 2026-09-04
complexity_level: 3
---

# Reflection: mobaxterm-active-and-scan-cache

## Summary

MobaXterm's applied INI is now an active Mirror candidate via Known Folder Documents, and Import/Mirror serve a process-lifetime `ThemeCache` warmed on `onStartupFinished`. The work matched the preflight-amended plan; QA passed with no rework.

## Requirements vs Outcome

All five brief requirements and five acceptance criteria shipped. Nothing was dropped in Build. Preflight reinterpreted Use-Case 4 / Requirement 4 / AC4: the brief had promised a per-command background refresh, which the scan-cache creative had already rejected. The amendment (launch and config-change rescan only) is what Build implemented. Portable / `-i` stay extraDirectories-only, as decided.

## Plan Accuracy

The unit order (cache → Documents root → extension wiring → matrices → memory-bank) and file list (`src/cache.ts`, not `scanCache.ts`) were correct after preflight. Identified challenges (ui-kind PowerShell, Linux CI never spawning, WSL host-test hang) did not bite because the plan already confined spawn to `windowsDocumentsDir` and tests to stdout parsers plus `documentsDir` injection.

One test was a weak red: coincidence (Known Folder coinciding with USERPROFILE Documents) already passed against the old USERPROFILE-only roots, because `seen` dedupes origins. The redirected-Documents case was the actual gate that `documentsDir` was wired.

## Creative Phase Review

Both chosen options held up in code. Known Folder Documents (Option A) did not need `LastIniPath` or extraDir-active marking. Process-lifetime `ThemeCache` (Option A) did not need `globalState`, a worker, or per-command rescan. `setTimeout(0)` in `load` was load-bearing: it is what makes `peek` empty until the walk finishes and what lets `activate` return before the scan. The mtime-signature advisory stayed out of scope, as the operator asked.

## Build & QA Observations

Build followed TDD per unit with no implementation thrash. Unit 3's only red was the `activationEvents` contract, by design: the stub step left the manifest empty so that test could fail. [Level 3 QA](8246651e-9eeb-4621-96a9-f626cb63abba) passed on the first run; it re-ran `test:parsers` (114) and `compile` and found no completeness, TDD, or doc-drift issues. Host tests were not run locally (known WSL Electron hang) and were not required by the plan.

## Cross-Phase Analysis

Preflight is why Build was uneventful. The first `FAIL (fixable)` caught three plan defects that would have shipped a cold cache (`activationEvents: []` on 1.75+), fused distinct extraDirectory walks (`cacheKey` sorting `extraDirectories`), and spawned PowerShell on Ghostty-only scans (lookup before source dispatch). The second `FAIL (fixable)` caught a TDD-encoding bug introduced by the first amendment: putting `onStartupFinished` in the stub step so the contract test could never go red. Re-running preflight after the amendment was load-bearing. The brief-versus-creative contradiction on "background refresh" was resolved in Plan, not in QA.

## Insights

### Technical

- Empty `activationEvents` on VS Code 1.75+ is command-only activation. A warm cache needs `onStartupFinished`; contributed commands still activate implicitly.
- `extraDirectories` order is load-bearing in discovery (Alacritty last-import-wins, `seen` first-walk-wins). A cache key must serialize that array as configured, not sorted.
- `%USERPROFILE%\Documents` is not Known Folder Documents. MobaXterm installer edition follows My Documents on whatever volume that folder uses.

### Process

- Re-run preflight after amending a `FAIL (fixable)`. The first fix here introduced a new TDD-encoding defect in the same unit the FAIL was about.
- A coincidence/dedup test that still passes against the old path is not a red. The redirected-Documents case is the gate that the new root is actually used.
