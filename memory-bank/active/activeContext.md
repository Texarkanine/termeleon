# Active Context

## Current Task: investigate-mobaxterm-themes
**Phase:** PLAN - COMPLETE

## What Was Done

- Investigated MobaXterm storage: palettes are INI `[Colors]` RGB triples in `MobaXterm.ini` and importable `.mxtcolors` / `.ini` theme files. Not compiled into the binary.
- Classified leftovers as known gaps: `DefaultColorScheme` index without RGB, undocumented `.mxtsessions` per-session blobs, syntax highlighting. Registry is credentials, not palettes.
- First preflight FAIL (fixable): plain `%USERPROFILE%\Documents` misses OneDrive Known Folder Move.
- Replanned: OneDrive Documents roots, first-root-wins active, `fromByteComponents` in `palette.ts`, British `Colour` keys only, package.json/`SOURCE_LABELS` in write-code not stub, document `-i` override.

## Next Step

- Preflight validation of the replanned plan.
