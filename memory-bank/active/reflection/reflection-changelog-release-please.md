---
task_id: changelog-release-please
date: 2026-08-31
complexity_level: 2
---

# Reflection: changelog-release-please

## Summary

Issue #7 is done: CHANGELOG.md, node-type release-please config/manifest, and a helper-app workflow on main, with no Marketplace/AMO/CWS jobs. Plan, preflight, build, and QA all passed without rework.

## Requirements vs Outcome

Every brief and acceptance criterion landed. `package.json` stays at `0.1.0` for release-please to bump. Preflight's VSIX-attach and package-lock advisories were left out on purpose (issue forbade publish jobs; lockfile is a different task).

## Plan Accuracy

File list and sequence were right. The live surprise is still unverified: siblings disagree on `client-id` vs `app-id` for `HELPER_APP_ID`. We followed tab-yeet as planned; the first push to main is the real check.

## Build & QA Observations

Build was config-only. Parser tests (11) and compile passed. QA passed with no findings that required a rebuild.

## Insights

### Technical
- A VS Code extension does not need a special release-please type. vsce already reads `package.json` `version`, so tab-yeet's node `release-type` is correct without extra-files.

### Process
- When sibling workflows disagree on one field (`client-id` vs `app-id` for the same org var), follow the issue's named sibling and document the one-line fallback. Do not invent a second secret.

### Million-Dollar Question

If release-please had been assumed from the first commit, these same root files would exist. There is no deeper hook into the extension. What we built is the starting-shape solution.
