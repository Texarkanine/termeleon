# Task: typescript-6-and-engine-pin

* Task ID: typescript-6-and-engine-pin
* Complexity: Level 2
* Type: simple enhancement (toolchain)

Upgrade the compiler to TypeScript 6.0 to match VS Code upstream, and pin `@types/vscode` to the `engines.vscode` floor so types cannot drift above the claimed VS Code version.

## Test Plan (TDD)

### Behaviors to Verify

No new executable behavior. This task does not change what an extension user can observe. TypeScript 6.0, `tsconfig`, the `@types/vscode` range, and Dependabot ignores are toolchain/policy. Do not invent tests that only pass or fail when someone edits `package.json` or `.github/dependabot.yaml`.

Verification in Build (not new tests):

- `npx tsx test/parsers.test.ts` — existing suite, including current Dependabot/`@types/node` contracts, stays green
- `npm run compile` — `tsc` accepts TypeScript 6.0 with `moduleResolution: bundler`
- `npm run package` — vsce engines check passes with `engines.vscode` `^1.75.0` and tilde-pinned `@types/vscode`
- `npm run test:host` after `compile-tests` — host suite still passes

### Test Infrastructure

- Framework: existing Node `assert` via `tsx`; Mocha TDD host tests. No new cases.
- Test location: none added
- Conventions: n/a
- New test files: none

## Implementation Plan

### 1. Engine-types pin and Dependabot ignore — prose/policy

- Files: `package.json`, `.github/dependabot.yaml`
- No tests: prose/policy artifact

1. Set `devDependencies['@types/vscode']` to `~1.75.0` (resolves 1.75.1). Leave `engines.vscode` at `^1.75.0`.
2. Add a Dependabot ignore for `@types/vscode` versions `>=1.76.0`, with a comment that this package's minor is the VS Code version, not a compatible API bump. Keep the TypeScript `>=7.0.0` and `@types/node` `>=23.0.0` ignores.

### 2. TypeScript 6.0 and tsconfig — prose/policy

- Files: `package.json`, `package-lock.json`, `tsconfig.json`
- No tests: prose/policy artifact

1. Set `devDependencies.typescript` to `^6.0.0`.
2. In `tsconfig.json`, set `moduleResolution` to `bundler` (keep `module`: `commonjs`). Set `types` to `["node"]`. Do not add `ignoreDeprecations`. `tsconfig.test.json` already extends this and sets `types`: `["node", "mocha"]`.
3. Regenerate `package-lock.json` from a clean tree (no `node_modules`) so linux CI can `npm ci`.
4. Run `npx tsx test/parsers.test.ts`, `npm run compile`, and `npm run package`. If `tsc` errors because `@types/vscode` 1.75 lacks an API the source uses, change the call site to a 1.75-era API without changing product behavior. Do not raise `engines.vscode`. If a call-site fix would change user-visible behavior, stop and ask.

### 3. Tech Context — prose/policy

- Files: `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. Record TypeScript 6.0 and `moduleResolution` `bundler` with `module` `commonjs`.
2. Record `@types/vscode` tilde-pin to the `engines.vscode` floor, and the Dependabot ignore `>=1.76.0`.
3. Leave the TS 7 and `@types/node` ignore notes; they stay true. Do not describe new parser contract tests for this pin.

## Technology Validation

No new technology - validation not required. TypeScript 6.0 is an upgrade of the existing `typescript` devDependency. `moduleResolution: bundler` with `module: commonjs` is documented in the [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html). Preflight already confirmed TypeScript 6.0.2 accepts that combination against `src/extension.ts`.

## Dependencies

- TypeScript 6.0: [`moduleResolution` node/node10 deprecated](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html); `bundler` + `commonjs` allowed; `types` defaults to `[]`.
- `@types/vscode` 1.75.0 / 1.75.1 on npm. vsce fails `npm run package` when the declared `@types/vscode` range is greater than `engines.vscode`.
- Existing Dependabot ignores and existing CI-contract tests in `test/parsers.test.ts` (unchanged).
- Lockfile regen from a clean tree (no `node_modules`).

## Challenges & Mitigations

- **Rolling types 1.134 → 1.75 surfaces newer vscode APIs:** if `tsc` fails, fix the source to 1.75-era APIs. Do not raise `engines.vscode`. Stop if the fix would change user-visible behavior.
- **TS 6 `types` default `[]` drops Node globals:** set `types: ["node"]` on the src config; host tests already list `node` and `mocha`.
- **`nodenext` would require `.js` extensions on relative imports:** do not use `nodenext`. Use `bundler` + `commonjs`.
- **Dirty-tree lockfile regen drops other-platform esbuild optionals:** delete `node_modules`, then `npm install`, per `techContext.md`.
- **Dependabot treats `@types/vscode` 1.75 → 1.136 as a semver minor:** grouping minor/patch is why #52 opened. The `>=1.76.0` ignore is the pin, not the group.

## Pre-Mortem

- **Plan failed because we merged Dependabot #52 and #53:** they fail for independent reasons. This plan supersedes them; do not merge those PRs.
- **Plan failed because we scheduled package.json/yaml string locks as tests:** already covered — Test Plan is "no new executable behavior"; vsce `npm run package` is the engines gate.
- **Plan failed because we silenced TS5107 with `ignoreDeprecations` and left `node10` for TS 7:** already covered — unit 2 migrates to `bundler`.
- **Plan failed because we added a second vsce (a package-validation command):** do not. vsce already compares `@types/vscode` to `engines.vscode`.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
