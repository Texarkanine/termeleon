---
task_id: investigate-mobaxterm-themes
date: 2026-09-02
complexity_level: 2
---

# Reflection: investigate-mobaxterm-themes

## Summary

MobaXterm palettes are on disk and now parse as a walkable source. A follow-on rework made Alacritty Mirror work on Windows: `%APPDATA%\alacritty` plus `import` / `[general].import` following, with exact-basename `alacritty.toml` as the config.

## Requirements vs Outcome

Original brief: on-disk MobaXterm outcome shipped; unused `DefaultColorScheme` indexes and `.mxtsessions` left unscanned on purpose. Rework brief: APPDATA root, both import spellings, last usable import active when the config itself is not a palette, Unix inline `alacritty.toml` still active. Recursive field-merge of imports was considered in preflight and left out on purpose. No extra `Palette` / apply / `extensionKind` change.

## Plan Accuracy

MobaXterm: first plan missed OneDrive Known Folder Move; preflight FAIL (fixable) added those roots. Alacritty: first rework plan named productContext/systemPatterns without a concrete edit; second FAIL (fixable) pinned exact-basename configs and an Alacritty clause in Best-Effort Discovery. After those replans, Build followed the sequence. Surprises were the suffix regex treating `extra-alacritty.toml` as a config, and that an import-only config is dropped by `isUsable` unless collected during the walk.

## Build & QA Observations

Parser and discovery TDD went red-then-green as written. QA found no implementation issues. `npm test` in this WSL session still cannot bind the vscode-test IPC socket (`EACCES` under `/run/user/1000`) and pops a throwaway Code dialog; that is not a regression of this work. CI does not run `test:host`.

## Insights

### Technical

- Any Windows "Documents" discovery path has to include OneDrive Known Folder Move. `%MyDocuments%` follows the redirect; `%USERPROFILE%\Documents` does not.
- A filename suffix is not "this is the emulator's config." Alacritty's config is the exact basename `alacritty.toml`. Import-only configs are not `isUsable`, so they have to be collected before that gate or Mirror never sees the import list.

### Process

- In this WSL remote, `npm test` launches vscode-test and fails at socket bind. For vscode-free discovery work, `test:parsers` plus `compile` is the verification gate that matches CI. Do not treat a host-harness dialog as a product failure.

### Million-Dollar Question

The MobaXterm increment is the right shape (`fromByteComponents`, Windows default roots, no shared INI reader until a PuTTY-family task). For Alacritty, the elegant version of "filename means active" was always "the config file is a pointer": exact-basename `alacritty.toml`, then inline palette or last usable import. Recursive merge and a shared path helper with kitty `include` are the next on-ramps, not this task.
