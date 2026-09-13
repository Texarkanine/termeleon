---
task_id: terminal-selection-visibility
date: 2026-09-13
complexity_level: 2
---

# Reflection: terminal-selection-visibility

## Summary

Selection after Import/Mirror is now visible when the source omitted a selection color (gated by `fillMissingSelection`, default on), mapping settings are documented as not-live, and Reapply Last Theme remaps the last committed palette — including turning contrast-ratio override off.

## Requirements vs Outcome

Delivered as asked: fill is opt-out, authored selection is never replaced, `includeSelectionForeground` still does not invent a foreground, Xresources highlight keys are mapped, and toggles take effect on Import/Mirror/Reapply. Added during QA: clearing a previously written `minimumContrastRatio: 1` when the contrast setting is off — that was implied by "not live, takes effect on Reapply" and was missing from the first build.

## Plan Accuracy

The mapping hub, Xresources parser, last-apply recording sites, and docs steps were right. Preflight caught pair-reapply tests and Import recording in `pickAndApply`. The surprise was not fill math; it was that "apply-time settings" still left contrast stuck at 1 because apply only implemented the true branch.

## Build & QA Observations

Fill and Reapply tests went in cleanly. Host tests on this WSL box need `XDG_RUNTIME_DIR` plus a dbus session, and preview delays of `PREVIEW_DEBOUNCE_MS + 400` against VS Code 1.137. QA failed twice: a duplicate README bullet, then the contrast-off Reapply hole. Both were real.

## Insights

### Technical
- A boolean mapping setting is not "apply-time" until both polarities write: true must set the key, false must undo the value this extension wrote. Contrast only did the true half until QA.
- `terminal.selectionBackground` defaults to `editor.selectionBackground`. Writing a new terminal background without a selection color is enough to make the highlight vanish, which is why MobaXterm looked empty and duskfox (authored selection) did not.

### Process
- "Takes effect on Reapply" needs a test that flips the setting from on to off, not only off to on. The first host tests only covered selection-foreground appearing, not contrast disappearing.

### Million-Dollar Question

If apply-time options had been a single "write or clear each owned setting" table from the start, contrast, fill, and selection-foreground would have shared one polarity helper instead of growing a special `applyContrastRatio` after QA. What we built is that helper for contrast; fill still only writes when missing. That's the right shape for fill. Contrast was the one that needed a clear-on-false.
