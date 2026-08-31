# Active Context

## Current Task: vsix-github-releases
**Phase:** BUILD - COMPLETE

## What Was Done
- Files: `/Users/tex/git/vscode-terminal-themes/test/parsers.test.ts`, `package.json`, `package-lock.json`, `.github/workflows/ci.yaml`, `.github/workflows/release-please.yaml`, `.vscodeignore`, `README.md`, `memory-bank/techContext.md`
- Publisher `texarkanine`; `npm run package` → `vsce package --no-dependencies`; CI and release-please follow-on
- Tightened `.vscodeignore` after the first `vsce package` shipped `.cursor/`, `.summem/`, and `memory-bank/` (not in the plan)
- Marketplace-word test narrowed to `vsce publish` / `VSCE_PAT` because the workflow comment already says "Marketplace"

## Next Step
- QA review (subagent)
