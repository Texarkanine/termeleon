# Tasks: Issue #33 - Mirror Live Preview

## Plan Phase
- [x] Initial research and context gathering
- [x] Initialize Memory Bank active files
- [x] Formulate implementation plan

## Preflight Phase
- [x] Preflight plan validation

## Build Phase (TDD)
- [ ] Add host test cases for `LivePreview.schedulePair` (preview and cancel)
- [ ] Add host test cases for mirror multi-candidate preview and cancel
- [ ] Run host tests to verify new test failure (Red)
- [ ] Implement `LivePreview.schedulePair` in `src/apply.ts`
- [ ] Implement `pickMirrorCandidate` with `LivePreview` and `ensureTerminalVisible` in `src/extension.ts`
- [ ] Run test suite (`npm run compile`, `npm run test:parsers`, `npm run test:host`) (Green)

## Verification Phase
- [ ] Run full test suite (`npm test`)
- [ ] Check linter and typecheck (`npm run compile`)

## QA & Reflection Phase
- [ ] QA semantic check
- [ ] Reflect on implementation and lessons learned

## Archive & PR Phase
- [ ] Create archive at `memory-bank/archive/bug-fixes/20260902-issue-33-mirror-live-preview.md`
- [ ] Clean ephemeral memory bank files
- [ ] Commit archive and push branch
- [ ] Create pull request via `gh pr create`
- [ ] Verify no bot comments or issues on PR
