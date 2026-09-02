# Tasks: Issue #33 - Mirror Live Preview

## Plan Phase
- [x] Initial research and context gathering
- [x] Initialize Memory Bank active files
- [x] Formulate implementation plan

## Preflight Phase
- [x] Preflight plan validation

## Build Phase (TDD)
- [x] Add host test cases for `LivePreview.schedulePair` (preview and cancel)
- [x] Add host test cases for mirror multi-candidate preview and cancel
- [x] Run host tests to verify new test failure (Red)
- [x] Implement `LivePreview.schedulePair` in `src/apply.ts`
- [x] Implement `pickMirrorCandidate` with `LivePreview` and `ensureTerminalVisible` in `src/extension.ts`
- [x] Run test suite (`npm run compile`, `npm run test:parsers`, `npm run test:host`) (Green)

## Verification Phase
- [x] Run full test suite (`npm test`)
- [x] Check linter and typecheck (`npm run compile`)

## QA & Reflection Phase
- [ ] QA semantic check
- [ ] Reflect on implementation and lessons learned

## Archive & PR Phase
- [ ] Create archive at `memory-bank/archive/bug-fixes/20260902-issue-33-mirror-live-preview.md`
- [ ] Clean ephemeral memory bank files
- [ ] Commit archive and push branch
- [ ] Create pull request via `gh pr create`
- [ ] Verify no bot comments or issues on PR
