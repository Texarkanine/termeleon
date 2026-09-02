---
task_id: investigate-mobaxterm-themes
date: 2026-09-02
complexity_level: 2
---

# Reflection: investigate-mobaxterm-themes

## Summary

MobaXterm palettes are on disk. Termeleon now parses `[Colors]` RGB triples from `MobaXterm.ini` and `.mxtcolors` / theme `.ini` files, discovers the Windows default roots including OneDrive-redirected Documents, and documents the index-only and `.mxtsessions` gaps.

## Requirements vs Outcome

Delivered the on-disk outcome from the brief. Unused `DefaultColorScheme` indexes and per-session `.mxtsessions` blobs were left unscanned on purpose, matching Windows Terminal packaged defaults. Nothing extra shipped: no registry story, no American `Color` aliases, no shared INI module.

## Plan Accuracy

The first plan missed OneDrive Known Folder Move (`%MyDocuments%` ≠ `%USERPROFILE%\Documents`). Preflight FAIL (fixable) added those roots and first-root-wins active. After replan, Build followed the sequence without further splits.

## Build & QA Observations

Parser and discovery TDD went red-then-green as written. Host tests hung in this WSL Electron/X11 session; they were not a gate (CI does not run them; apply path unchanged). QA re-ran parsers and compile, found no blockers.

## Insights

### Technical

- Any Windows "Documents" discovery path has to include OneDrive Known Folder Move. `%MyDocuments%` follows the redirect; `%USERPROFILE%\Documents` does not.

### Process

- For emulator-format work, reading vendor docs and real theme-pack files during Plan is what turns "can we?" into a linear parser task. Preflight then caught the one Windows-path edge the plan's Challenges list had skipped.

### Million-Dollar Question

The same `Palette` hub, a `fromByteComponents` sibling to `fromFloatComponents`, and a walkable discoverer with Windows default roots. A shared INI section reader would only have been foundational if PuTTY-family support had been in scope from day one. This increment is the right shape.
