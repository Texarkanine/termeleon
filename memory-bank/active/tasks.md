# Task: issue-6-extension-host-tests

* Task ID: issue-6-extension-host-tests
* Complexity: Level 2
* Type: simple enhancement

Add an Extension Development Host suite so apply, surgical remove, and live-preview cancel restore are proven. Parser tests stay vscode-free. Authoritative scope: https://github.com/Texarkanine/vscode-terminal-themes/issues/6

## Test Plan (TDD)

### Behaviors to Verify

- Flat apply: `applyPalette` with `scopeToActiveTheme: false` at workspace target → `workbench.colorCustomizations` workspace value contains the palette's terminal keys and nothing from unrelated existing keys is dropped; owned-key state lists those keys
- Scoped apply: `scopeToActiveTheme: true` → colors live under `[active workbench theme]`; owned keys are stored as `[Theme].terminal.*`
- Preserve outsiders: a non-terminal key already in colorCustomizations survives apply and owned-key remove
- Omit undefined slots: a palette without `cursor` does not write `terminalCursor.foreground` and does not clear a pre-existing value of that key
- Selection foreground off: `includeSelectionForeground: false` does not write `terminal.selectionForeground` even when the palette has one
- Selection foreground on: `includeSelectionForeground: true` writes `terminal.selectionForeground` when the palette has one
- Contrast nudge: `setMinimumContrastRatio: true` sets `terminal.integrated.minimumContrastRatio` to `1` at the same configuration target
- Inspect not merge: applying at workspace does not copy global colorCustomizations into the workspace value
- Remove owned: after apply, `removeApplied(ctx, target, false)` deletes only owned keys, leaves outsider keys, clears owned state, returns `usedFallback: false`
- Remove no-op: empty owned keys and `allowFallback: false` → `{ removed: 0, usedFallback: false }` and settings unchanged
- Remove fallback: empty owned keys and `allowFallback: true` sweeps `managedKeys()` at the top level and inside `[Theme]` blocks, returns `usedFallback: true`
- Fallback scoped cleanup: fallback remove that empties a `[Theme]` object deletes that object
- Snapshot restore: `restoreSnapshot` writes the captured object back; restoring `undefined`/empty clears the target's colorCustomizations
- Preview cancel: `LivePreview` applies a palette then `cancel()` restores the pre-session snapshot (including the empty case)
- Preview debounce: two `schedule` calls inside `PREVIEW_DEBOUNCE_MS` result in only the second palette being written; `cancel()` still restores the original snapshot

### Test Infrastructure

- Framework: Mocha TDD (`suite`/`test`/`assert`) inside an Extension Development Host via `@vscode/test-cli` + `@vscode/test-electron`. Parser suite (`tsx` + `test/parsers.test.ts`) is unchanged and must not import `vscode`.
- Test location: `test/host/`
- Conventions: `*.test.ts` compiled by `tsconfig.test.json` to `out/test/host/**/*.test.js`. Host tests may import `src/apply.ts` (tsc emit under `out/src/`). They always use isolated VS Code user-data (`--user-data-dir` under `os.tmpdir()`) so global writes cannot touch the operator's real settings.
- New test files: `test/host/apply.test.ts`, `test/host/preview.test.ts`. Harness smoke `test/host/smoke.test.ts` already exists from technology validation.

Characterization note: `applyPalette` / `removeApplied` / `restoreSnapshot` already exist. Their host tests are characterization tests — the first full run is expected GREEN. Do not edit apply.ts to “make them pass.” If they fail, that is a product bug: stop and fix it with a new TDD cycle. `LivePreview` is new: stub, red, then implement.

## Implementation Plan

### 1. Host harness scripts and packaging — prose/policy

- Files: `package.json`, `.vscodeignore`, `.gitignore`, `README.md`
- No tests: prose/policy artifact (scripts and ignore lists). Harness already proven by smoke test during plan validation.

1. Add `compile-tests`, `pretest:host`, `test:host`; keep `test:parsers`; make `test` run parsers then host.
2. Ignore `out/` and `.vscode-test/` in `.vscodeignore` (gitignore already updated).
3. Document `npm run test:host` in README Development (downloads VS Code; uses a short temp user-data-dir).

### 2. Apply, remove, snapshot — executable

- Files: `test/host/apply.test.ts`, `test/host/helpers.ts`

1. Stub tests: empty `suite`/`test` names in `test/host/apply.test.ts` covering the apply/remove/snapshot behaviors above.
2. Stub interface: `fakeContext()` Memento double and `samplePalette()` in `test/host/helpers.ts`. No new production signatures; apply APIs exist.
3. Write tests and run red: fill assertions against workspace (and isolated global) `inspect` values. First run is expected GREEN (characterization). `afterEach` restores colorCustomizations and minimumContrastRatio at both targets.
4. Write code and run green: no production change unless a characterization test fails.

### 3. LivePreview debounce and cancel — executable

- Files: `src/apply.ts`, `src/extension.ts`, `test/host/preview.test.ts`

1. Stub tests: empty cases in `test/host/preview.test.ts` for cancel restore (including empty snapshot) and debounce (two schedules, only last apply, then cancel restores original).
2. Stub interface: in `src/apply.ts` export `PREVIEW_DEBOUNCE_MS` and class `LivePreview` with `constructor(ctx, opts)`, `schedule(palette)`, `cancel()` — empty bodies.
3. Write tests and run red: assertions on workspace colorCustomizations vs time; wait `PREVIEW_DEBOUNCE_MS + 50` rather than fake timers.
4. Write code and run green: implement `LivePreview` (snapshot in constructor, debounce `applyPalette` on `schedule`, clear timer + `restoreSnapshot` on `cancel`). Point `pickAndApply` in `src/extension.ts` at `LivePreview` instead of an inline timer. Re-run host tests plus `npm run test:parsers`.

## Technology Validation

New dependencies (dev): `@vscode/test-cli@^0.0.15`, `@vscode/test-electron@^3.1.0`, `@types/mocha@^10.0.10`.

PoC on 2026-08-31 in this worktree:

- `npx tsc -p tsconfig.test.json` and `npm run compile` succeed.
- Default `.vscode-test/user-data` fails on macOS: IPC socket path exceeds ~103 characters (`EINVAL` on `1.13-main.sock`).
- `.vscode-test.mjs` now passes `--user-data-dir` under `os.tmpdir()` (`vtt-h-*`).
- `npx vscode-test` downloaded VS Code 1.135.0 and passed `host harness opens the fixture workspace` (1 passing).

Config already in tree: `.vscode-test.mjs`, `tsconfig.test.json`, `test/host/smoke.test.ts`, `test/host/fixtures/workspace/.gitkeep`. `package-lock.json` was created by npm; commit it so the runner versions stay reproducible.

## Dependencies

- `@vscode/test-cli` / `@vscode/test-electron` / `@types/mocha` (dev)
- Existing `apply.ts` APIs and `toColorCustomizations` / `managedKeys`
- Fixture workspace folder so workspace-target writes have a `.vscode/settings.json` location
- Network once per machine to download VS Code into `.vscode-test/` (gitignored)

## Challenges & Mitigations

- macOS socket path limit: already mitigated with a short temp `--user-data-dir`.
- Polluting the operator's real `settings.json`: isolated user-data-dir plus `afterEach` restore; prefer workspace target; global tests only hit the temp profile.
- Flaky debounce: real clock with `PREVIEW_DEBOUNCE_MS + 50` and mocha timeout 20000; do not drive QuickPick.
- Tests import tsc `out/src/apply.js` while the host loads esbuild `dist/extension.js`: acceptable for this bundle. `LivePreview` is implemented in `src/apply.ts` so both compiles see the same source. Do not assert on picker internals.
- `package-lock.json` may collide with other issue worktrees: still commit it; parent orchestrator reconciles.
- `--disable-extensions` must not prevent loading this extension: `extensionDevelopmentPath` still loads it (smoke test proved this).

## Pre-Mortem

- Tests try to click the QuickPick and flake: plan already uses `LivePreview` instead of UI automation.
- `npm test` replaces parser tests: plan keeps `test:parsers` and sequences both.
- First apply tests fail because they used `get()` (merged) instead of `inspect()`: tests will use `inspect` at one target, matching `readAt`.
- Host suite is skipped in CI later because nobody documented the temp user-data-dir: README + `.vscode-test.mjs` carry that; CI is issue 3, not this task.
- Extracting `LivePreview` accidentally changes hide/accept ordering: keep accept as “apply again after picker resolves”; hide still cancels only when not accepted.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
