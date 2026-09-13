---
task_id: typescript-6-and-engine-pin
date: 2026-09-13
complexity_level: 2
---

# Reflection: typescript-6-and-engine-pin

## Summary

The compiler is TypeScript 6.0.3 with `moduleResolution: bundler`. `@types/vscode` is tilde-pinned to the `engines.vscode` 1.75 floor. The published VS Code floor did not move.

## Requirements vs Outcome

Delivered: TS 6, tsconfig accepted by 6.0, engines still `^1.75.0`, types cannot caret-float or Dependabot-minor past 1.75, existing TS 7 / `@types/node` ignores kept. Dropped (after preflight): new parser contract tests for the pin. Added: host picker suite pins `scopeToActiveTheme` off so unscoped preview assertions survive the #54 default flip. CI still does not run `test:host`.

## Plan Accuracy

Sequence and files were right. Preflight correctly struck configuration change-detectors. The surprise was not TS 6 — it was vsce only comparing declared ranges (lockfile 1.134 never failed `package`) and the picker test assuming unscoped apply after the default became on.

## Build & QA Observations

Compile, parsers, and `package` were green on the first pass. QA failed once: `techContext.md` described the vscode ignore as locked by the `ci` tests. The Package bullet now states the policy; the `ci` list matches what the tests assert.

## Insights

### Technical
- `@types/vscode` minors are VS Code versions. Dependabot's development-deps minor group will propose 1.75 → 1.136. vsce compares declared range strings, not the lockfile, so a caret can drift until Dependabot rewrites `package.json`.

### Process
- Do not document a Dependabot ignore as if a parser contract test covers it. CI does not run `test:host`; a settings-default change can leave the local host suite red while CI stays green.

### Million-Dollar Question

Pin `@types/vscode` with a tilde to the engines floor from the first `package.json`, and use `moduleResolution: bundler` with `module: commonjs` as the TypeScript 6 shape. That is what we built.
