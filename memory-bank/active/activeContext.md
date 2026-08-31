# Active Context

## Current Task: ghostty-autodetect-pairs
**Phase:** BUILD - COMPLETE

## What Was Done
- Pair identity: `toGhosttyDiscovered`, `activeGhosttyPair`, `mirrorCandidates`; `discoverGhostty` stamps appearance only through `toGhosttyDiscovered`, including the inline-config fallback.
- Merge/apply: `pairScopes`, `preferredPairScopes`, `mergeColors`, `mergePairedColors`; `applyPalette` uses `mergeColors`; `applyPalettePair` reads preferred dark/light via `preferredPairScopes` and strips previously owned keys.
- Mirror uses `MirrorCandidate` (`theme` | `pair`) and calls `applyPalettePair` for a Ghostty pair.
- README and productContext: pairing is documented as Mirror behavior, not a known limit.
- Tests: 20 passing in `test/parsers.test.ts` (9 new). Compile clean.

## Files modified
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/src/palette.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/src/discover.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/src/apply.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/src/extension.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/test/parsers.test.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/README.md`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-9-ghostty-autodetect/memory-bank/productContext.md`

## Key decisions
- Inline Ghostty config-as-theme goes through `toGhosttyDiscovered` with `{ single: 'Ghostty config (inline)' }`.
- Preflight "bind any two themes" idea was not implemented.

## Next Step
- QA review.
