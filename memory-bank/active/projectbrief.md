# Project Brief

## User Story

As a Termeleon maintainer, I want the toolchain on TypeScript 6.0 to match VS Code upstream, and I want `@types/vscode` pinned so it cannot drift above the VS Code version we claim to support, so Dependabot cannot open red PRs that raise types past `engines.vscode`.

## Use-Case(s)

### Compile on TypeScript 6.0

`npm run compile`, parser tests, and host-test compile succeed on TypeScript 6.0 with a `tsconfig` that 6.0 accepts (today `moduleResolution: "node"` fails with TS5107).

### Types cannot exceed the claimed engine

`engines.vscode` stays `^1.75.0`. `@types/vscode` cannot resolve or be Dependabot-rewritten above that floor. `vsce package` stays green without raising the published engine.

## Requirements

1. Upgrade the TypeScript compiler to 6.0.x and adjust `tsconfig.json` / `tsconfig.test.json` so `tsc` succeeds under 6.0.
2. Keep `engines.vscode` at `^1.75.0`. Do not raise the supported VS Code floor.
3. Pin `@types/vscode` so it cannot drift above that claimed floor (lockfile, `package.json` range, and Dependabot).
4. Keep the existing Dependabot ignore for TypeScript 7 (`>=7.0.0`) and `@types/node` (`>=23.0.0`); extend policy so `@types/vscode` cannot be bumped past `engines.vscode`.
5. Update CI contract tests in `test/parsers.test.ts` so they lock the new toolchain and pin policy.

## Constraints

1. `engines.vscode` remains `^1.75.0`. TypeScript 6.0 is compile-time only.
2. Do not take `@types/vscode` 1.136 (or any version vsce treats as greater than `engines.vscode`).
3. Generate or refresh `package-lock.json` from a clean tree (no `node_modules`) so linux CI can `npm ci`.
4. vscode-free core stays vscode-free. No product-behavior changes.

## Acceptance Criteria

1. `package.json` resolves `typescript` to 6.0.x; `npm run compile` and `npm run test:parsers` pass.
2. `engines.vscode` is still `^1.75.0`.
3. `@types/vscode` cannot exceed that floor via caret float or Dependabot; `npm run package` does not fail the vsce engines check.
4. `dependabot.yaml` still ignores `typescript >=7.0.0` and `@types/node >=23.0.0`, and prevents `@types/vscode` from drifting above `engines.vscode`.
5. Parser CI-contract tests fail if those policies are removed.
