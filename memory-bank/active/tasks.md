# Task: typescript-6-and-engine-pin

* Task ID: typescript-6-and-engine-pin
* Complexity: Level 2
* Type: simple enhancement (toolchain)

Upgrade the compiler to TypeScript 6.0 to match VS Code upstream, and pin `@types/vscode` to the `engines.vscode` floor so types cannot drift above the claimed VS Code version.

## Test Plan (TDD)

### Behaviors to Verify

- TypeScript major is 6: `package.json` `devDependencies.typescript` → range starts with `^6.`
- Engine floor unchanged: `package.json` `engines.vscode` → still a caret range whose `major.minor` is `1.75` (`^1.75.0`)
- Types lockstep: `@types/vscode` range is tilde (or exact) on that same `major.minor` → npm cannot resolve `1.76.0` or higher
- Dependabot cannot propose types past the floor: `.github/dependabot.yaml` names `@types/vscode` with `versions` including `>=1.76.0`
- Existing ignores remain: Dependabot still names `typescript` `>=7.0.0` and `@types/node` `>=23.0.0`
- `@types/node` major still tracks `.nvmrc` (existing test, must stay green)

### Test Infrastructure

- Framework: Node `assert` via `tsx` (`test/parsers.test.ts` `ci` section)
- Test location: `test/parsers.test.ts` (existing CI-contract tests; same pattern as Dependabot toolchain ignores and `@types/node` vs `.nvmrc`)
- Conventions: `test('name', () => { ... })`; read repo-root files; no `vscode` import
- New test files: none

These are product contracts for contributors and CI (`npm run compile` / `npm run package` / Dependabot): they go red when the published engine floor and the types Dependabot may install disagree, or when the compiler major leaves 6. Do not add a change-detector that asserts `tsconfig.json` text (`moduleResolution` is proven by `tsc`, not by a string lock).

## Implementation Plan

### 1. Engine-types lockstep and Dependabot pin — executable

- Files: `test/parsers.test.ts`, `package.json`, `.github/dependabot.yaml`

1. Stub tests: empty cases in the `ci` section for (a) `@types/vscode` range is `~` or exact on the `engines.vscode` floor `major.minor`, (b) Dependabot ignores `@types/vscode` `>=1.76.0`. Keep the existing typescript-7 and `@types/node` ignore cases.
2. Stub interface: no new functions. No `package.json` / yaml edits yet.
3. Write tests and run red: `npx tsx test/parsers.test.ts`. Derive floor `1.75` from `engines.vscode` (`^\d+\.\d+`); assert `devDependencies['@types/vscode']` matches `~1.75.` or `1.75.` (not `^1.75.0`, which floats to 1.134). Assert dependabot.yaml contains `dependency-name` `@types/vscode` and `>=1.76.0`. Current tree is `^1.75.0` with no vscode ignore → red.
4. Write code and run green: set `@types/vscode` to `~1.75.0` (resolves 1.75.1). Add Dependabot ignore for `@types/vscode` `>=1.76.0` with a comment that minors on this package are VS Code versions, not compatible APIs. Do not change `engines.vscode`. Do not bump TypeScript in this unit.

### 2. TypeScript 6.0 and tsconfig — executable

- Files: `test/parsers.test.ts`, `package.json`, `package-lock.json`, `tsconfig.json`

1. Stub tests: empty case that `devDependencies.typescript` starts with `^6.`
2. Stub interface: no new functions. Do not edit tsconfig yet.
3. Write tests and run red: `npx tsx test/parsers.test.ts`. Current range is `^5.4.0` → red.
4. Write code and run green: set `typescript` to `^6.0.0`. In `tsconfig.json`, set `moduleResolution` to `bundler` (keep `module`: `commonjs` — TypeScript 6.0 allows that pair) and set `types` to `["node"]` so Node globals (`process`, etc.) still load after the TS 6 `types` default of `[]`. Do not add `ignoreDeprecations`. `tsconfig.test.json` already extends the root config and sets `types`: `["node", "mocha"]`. Regenerate `package-lock.json` from a clean tree (no `node_modules`) so linux CI can `npm ci`. Then `npx tsx test/parsers.test.ts` and `npm run compile`. If `tsc` errors because `@types/vscode` 1.75 lacks an API the source uses, change the call site to a 1.75-era API — do not raise `engines.vscode`.

### 3. Tech Context — prose/policy

- Files: `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. Record TypeScript 6.0 and `moduleResolution` `bundler` with `module` `commonjs`.
2. Record `@types/vscode` tilde-pin to the `engines.vscode` floor, and the Dependabot ignore `>=1.76.0`.
3. Leave the TS 7 and `@types/node` ignore notes; they stay true.

## Technology Validation

No new technology - validation not required. TypeScript 6.0 is an upgrade of the existing `typescript` devDependency. `moduleResolution: bundler` with `module: commonjs` is documented in the [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

## Dependencies

- TypeScript 6.0: [`moduleResolution` node/node10 deprecated](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html); `bundler` + `commonjs` allowed; `types` defaults to `[]`; `ignoreDeprecations: "6.0"` exists but is not used here.
- `@types/vscode` 1.75.0 / 1.75.1 on npm. vsce fails `npm run package` when the declared `@types/vscode` range is greater than `engines.vscode`.
- Existing Dependabot ignore policy and CI-contract tests in `test/parsers.test.ts` (`techContext.md`).
- Lockfile regen from a clean tree (no `node_modules`).

## Challenges & Mitigations

- **Rolling types 1.134 → 1.75 surfaces newer vscode APIs:** the lockfile already drifted. If `tsc` fails, fix the source to 1.75-era APIs. Do not raise `engines.vscode`.
- **TS 6 `types` default `[]` drops Node globals:** set `types: ["node"]` on the src config; host tests already list `node` and `mocha`.
- **`nodenext` would require `.js` extensions on relative imports:** do not use `nodenext`. Use `bundler` + `commonjs`.
- **Dirty-tree lockfile regen drops other-platform esbuild optionals:** delete `node_modules`, then `npm install`, per `techContext.md`.
- **Dependabot treats `@types/vscode` 1.75 → 1.136 as a semver minor:** grouping minor/patch is why #52 opened. The `>=1.76.0` ignore is the pin, not the group.

## Pre-Mortem

- **Plan failed because we merged Dependabot #52 and #53:** they fail for independent reasons. This plan supersedes them; do not merge those PRs.
- **Plan failed because we froze `engines.vscode` at `^1.75.0` in a change-detector:** the durable test is lockstep (types `major.minor` equals engines floor). This task still must not change the floor; assert `1.75` once as the current floor so a drive-by engines bump fails this task's acceptance. Later engine bumps update types and that assertion together.
- **Plan failed because we silenced TS5107 with `ignoreDeprecations` and left `node10` for TS 7:** already covered — unit 2 migrates to `bundler`.
- **Plan failed because compile-green was treated as the only types-pin test:** already covered by unit 1's range + Dependabot assertions; `npm run package` remains the vsce gate in CI.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
