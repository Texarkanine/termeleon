---
task_id: github-actions-ci
date: 2026-08-31
complexity_level: 2
---

# Reflection: GitHub Actions CI

## Summary

Added tab-yeet-shaped GitHub Actions that run `npm ci`, `npm run test:parsers`, and `npm run compile` on pull requests and pushes to `main`. QA passed; `Fixes #3` is on the feature commit.

## Requirements vs Outcome

Delivered as specified: `.nvmrc`, committed lockfile, workflow with those two gates, no REUSE/Codecov/vsce. Nothing dropped. Contract tests in `test/parsers.test.ts` were a planned addition, not extra product behavior.

## Plan Accuracy

File list and sequence were right. The surprise was not in the YAML: generating the lockfile while `node_modules` already existed pruned non-darwin esbuild optional packages. Regenerating from a clean tree put linux (and other) platform entries back. Docker was installed but the daemon was down, so linux `npm ci` was not container-verified.

## Build & QA Observations

TDD was straightforward: three contract cases went red on missing files, then green. QA found nothing blocking and no advisories. Preflight's optional `npm run ci` script and `.vscodeignore` hygiene were left out of scope on purpose.

## Insights

### Technical

- Generate `package-lock.json` from a clean tree. npm 10 with `node_modules` already present keeps only the current-platform esbuild optional packages; linux CI then cannot `npm ci`.

### Process

- A cross-file contract in the existing `test:parsers` harness is enough TDD for a GitHub workflow. Do not add a YAML parser or a second test command.

### Million-Dollar Question

If CI had been a day-one assumption, the initial snapshot would have included `.nvmrc` and a clean-tree lockfile, and the workflow would be the thin YAML we shipped. A single `npm run ci` script would make "CI is what you run locally" true by construction; we did not add it because the issue named the two existing scripts.
