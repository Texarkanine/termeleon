# Active Context

## Current Task: terminal-selection-visibility
**Phase:** REFLECT COMPLETE

## What Was Done
- Reflected on selection visibility, Reapply, and the QA-found contrast-off polarity gap.
- Surgically updated `systemPatterns.md`: apply/Reapply clear a written contrast `1` when the setting is off; last-apply is committed Import/Mirror only.
- Operator asked about a selection-mode dropdown (unmodified / synthesize / swap). VS Code cannot per-cell invert selection; a fake fg/bg swap would flatten ANSI. Checkbox (`fillMissingSelection`) stays.

## Next Step
- Run `/niko-archive` to archive this standalone task. Then open a PR from `terminal-selection`.

