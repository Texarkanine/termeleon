# Active Context

## Current Task: clean-up-minimum-contrast-ratio
**Phase:** BUILD - COMPLETE

## What Was Done
- TDD reproduction test cases added in `test/host/apply.test.ts`, `test/host/preview.test.ts`, and `test/parsers.test.ts`
- Extended `ApplySnapshot` and `restoreApplySnapshot` in `src/palette.ts` to include `minimumContrastRatio`
- Updated `src/apply.ts` with `writeContrastRatioAt` helper, `snapshotApply`/`restoreApply` restoring `minimumContrastRatio` on preview cancel, and `removeApplied` clearing `minimumContrastRatio: 1` at target
- Updated `README.md` to document `minimumContrastRatio` cleanup on theme removal
- Verified all parser, discovery, and extension host tests pass

## Next Step
- Transition to QA phase (spawn subagent to run `/niko-qa`)
