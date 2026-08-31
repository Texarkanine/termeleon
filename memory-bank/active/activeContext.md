# Active Context

## Current Task: ghostty-autodetect-pairs
**Phase:** PLAN - COMPLETE

## What Was Done
- Replanned after preflight FAIL (fixable).
- Added vscode-free seams: `toGhosttyDiscovered` (appearance stamping) and `preferredPairScopes` (must read `preferredDarkColorTheme` / `preferredLightColorTheme`, not `colorTheme`). Adopted `pairScopes` from the preflight advisory.
- Mirror still collapses a Ghostty pair via `mirrorCandidates`. Import picker stays single-theme. Do not flip `window.autoDetectColorScheme`.

## Next Step
- Re-run preflight on the revised plan.
