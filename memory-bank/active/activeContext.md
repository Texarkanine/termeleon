# Active Context

## Current Task: typescript-6-and-engine-pin
**Phase:** BUILD - COMPLETE

## What Was Done
- TypeScript `^6.0.0` (lockfile 6.0.3). `tsconfig.json`: `moduleResolution: bundler`, `types: ["node"]`.
- `@types/vscode` `~1.75.0` (lockfile 1.75.1). Dependabot ignores `>=1.76.0`. `engines.vscode` still `^1.75.0`.
- Host picker suite pins `scopeToActiveTheme` off so unscoped preview assertions do not depend on the contributed default (on since #54).
- `npm run compile`, `npm run test:parsers` (85+32+8), `npm run package`, `npm run test:host` (47) all green.

## Next Step
- QA.

## Files modified
- `/home/mobaxterm/git/termeleon/package.json`
- `/home/mobaxterm/git/termeleon/package-lock.json`
- `/home/mobaxterm/git/termeleon/tsconfig.json`
- `/home/mobaxterm/git/termeleon/.github/dependabot.yaml`
- `/home/mobaxterm/git/termeleon/memory-bank/techContext.md`
- `/home/mobaxterm/git/termeleon/test/host/picker.test.ts`
