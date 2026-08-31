# Active Context

## Current Task: ghostty-autodetect-pairs
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Replanned after preflight FAIL (fixable).
- Added vscode-free seams: `toGhosttyDiscovered` (appearance stamping) and `preferredPairScopes` (must read `preferredDarkColorTheme` / `preferredLightColorTheme`, not `colorTheme`). Adopted `pairScopes` from the preflight advisory.
- Mirror still collapses a Ghostty pair via `mirrorCandidates`. Import picker stays single-theme. Do not flip `window.autoDetectColorScheme`.
- Re-ran preflight: `PASS WITH ADVISORY`. Both prior FAIL (fixable) findings resolved. Advisories recorded for Build: add a direct single-scope `mergeColors` test, confirm `discoverGhostty`'s inline-config fallback's stamping path, and give the pair-candidate QuickPick row a concrete discriminated type.

## Next Step
- Proceed to Build.
