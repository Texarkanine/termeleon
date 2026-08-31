---
task_id: vsix-github-releases
date: 2026-08-31
complexity_level: 2
---

# Reflection: vsix-github-releases

## Summary

A local `npm run package` and a release-please follow-on now produce and attach a VSIX. The first pack showed that vsce includes everything not listed in `.vscodeignore`.

## Requirements vs Outcome

All brief items landed: GitHub Release attach, publisher + vsce, local command, README loop, branch off `initialdev`, no Marketplace. Added (not in the original plan): agent-tree `.vscodeignore` entries and a contract test for them, after the first VSIX shipped `.cursor/`, `.summem/`, and `memory-bank/`.

## Plan Accuracy

File list and `release_created` wiring were right. The surprise was vsce's default include set, not helper-app upload or lockfile prune.

## Build & QA Observations

Contract tests went red then green as planned. The Marketplace-word assertion had to be narrowed because the existing workflow comment already says "Marketplace". QA passed with no findings; a live pack confirmed a slim VSIX.

## Insights

### Technical
- `vsce package` ships the repo minus `.vscodeignore`. Agent/memory trees must be named there or they go to users.

### Process
- Run `vsce package` once during build and read the included-files tree; ignore-list tests cannot see what vsce actually packs.

### Million-Dollar Question

Same shape: pin vsce, `package` script, gate upload on `release_created`. The ignore list should have been treated as part of the packaging contract from the start, not a cleanup after the first tree dump.
