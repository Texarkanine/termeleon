---
task_id: terminal-selection-visibility
date: 2026-09-13
complexity_level: 2
---

# Reflection: terminal-selection-visibility

## Summary

Selection after Import/Mirror is visible when the source omitted a highlight (`overrideMissingSelectionHighlight`, default on). Authored selection foreground is honored unless `overrideIncludedSelectionForeground` is on. Settings are split into Picker Behavior (live) and Color Preferences when Applying New Themes (next Import/Mirror/Reapply). Reapply remaps the last committed palette, including turning contrast-ratio override off.

## Requirements vs Outcome

Original brief delivered: missing-highlight fill, Xresources highlight keys, Reapply, apply-time copy. First-cycle QA added clearing a written `minimumContrastRatio: 1` when that setting is off. Rework delivered: two Settings categories, override ids, inverted foreground default (honor authored fg unless overridden), old ids gone. No aliases.

## Plan Accuracy

First cycle: mapping hub, last-apply sites, and docs were right; preflight caught pair-reapply tests and Import recording in `pickAndApply`; contrast only implemented the true branch until QA. Rework plan was right on polarity inversion and flattening the configuration array; Broadcast exact-map including `#e6e1dc` was the tripwire. Preflight advisory (settings-to-ApplyOptions adapter) left undone on purpose.

## Build & QA Observations

First cycle QA failed twice (duplicate README bullet, then contrast-off Reapply). Rework QA passed on the first pass. Host tests still need a writable `XDG_RUNTIME_DIR` plus `dbus-launch` on this WSL box (`/run/user/1000` is `EACCES`).

## Insights

### Technical
- A boolean mapping setting is not apply-time until both polarities write. Contrast needed clear-on-false; fill only writes when missing, which is the right shape.
- `terminal.selectionBackground` defaults to `editor.selectionBackground`. Writing a new terminal background without a highlight is enough to make selection vanish.
- Naming a flag `includeX` with default off encoded "skip the theme" as the default. Naming it `overrideX` with default off matches "honor the theme unless you opt out."

### Process
- "Takes effect on Reapply" needs a test that flips the setting from on to off, not only off to on. That was the first cycle's contrast gap.
- Rework of a just-reflected task is cheaper than a new task if the product names were wrong: same hub, inverted `if`, new contract tests.

### Million-Dollar Question

Honor authored colors unless an override says otherwise. Fill-when-missing is already that. Selection foreground was inverted: skip-by-default, opt in to the theme. The rework is the shape we would have built if that had been the assumption from the start. Contrast still needs its own clear-on-false helper because it writes a non-color setting.
