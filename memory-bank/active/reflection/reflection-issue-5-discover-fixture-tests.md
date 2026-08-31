---
task_id: issue-5-discover-fixture-tests
date: 2026-08-31
complexity_level: 2
---

# Reflection: discover-fixture-tests

## Summary

Issue #5 is done: `discoverThemes` is covered by Node/`tsx` tests against a fake `$HOME` / `$XDG_CONFIG_HOME` tree, and discovery reads those values at scan time instead of at import.

## Requirements vs Outcome

All four issue behaviors shipped (find, Ghostty active, kitty active, skip unusable, missing dir). Nothing extra (no extraDirs / WT / iTerm2 cases). The only production change was moving path resolution to call time, which the plan called for so per-test env mutation works.

## Plan Accuracy

The plan's sequence and file list were right. The predicted red/green split happened: empty path helpers failed find/active/skip and left the missing-dir case green. Darwin `/Applications/Ghostty.app` never bit us because assertions used planted `origin` paths.

## Build & QA Observations

Build was linear TDD with no extra iteration. QA passed with no findings to fix. Preflight advised a filesystem injector; we left that out.

## Insights

### Technical
- `os.homedir()` / XDG captured at module load makes `$HOME` injection a lie for any importer that already loaded `discover.ts`. Scan-time helpers are the whole testability fix; a new public roots API is not required.
- Ghostty discovery on Darwin always walks `/Applications/Ghostty.app`, which is outside `$HOME`. Discovery tests must assert fixture `origin`s, never list length or a bare theme name.

### Process
- Empty interface stubs that return no paths are a useful red: "does not throw on missing dir" can pass while "finds a theme" is still red, which is the split you want.

### Million-Dollar Question

Scan-time HOME/XDG reads plus origin-keyed fixture tests. That is what we built. Injecting a filesystem/environment object would only pay off if tests needed to run in parallel in one process.
