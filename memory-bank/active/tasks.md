# Current Task: npm-audit-mocha-transitives

**Complexity:** Level 1

## Fix

- **What broke:** `npm audit` reported three findings — `diff` DoS (low, GHSA-73rr-hh4g-fpgx), `serialize-javascript` RCE (high, GHSA-5c6j-r48x-rmvq), and `serialize-javascript` CPU DoS (moderate, GHSA-qj8w-gfj5-8c6v). All sit under mocha 11.8.0, which is pulled by `@vscode/test-cli`.
- **Why:** mocha 11 pins `diff@^7.0.0` and `serialize-javascript@^6.0.2`. Patched floors are `diff@>=8.0.3` and `serialize-javascript@>=7.0.5`. `npm audit fix` cannot reach them. mocha 12 has the bumps, but `@vscode/test-cli@0.0.15` still depends on `mocha@^11.7.6`. Downgrading `@vscode/test-cli` to 0.0.11 does not help.
- **What changed:** mocha-scoped `overrides` in `package.json` (`diff@^8.0.3`, `serialize-javascript@^7.0.5`). Lockfile refreshed from a clean tree. Resolved `diff@8.0.4` and `serialize-javascript@7.1.1`. `@vscode/test-cli` stays at `^0.0.15`.
- **Verdicts:** all three are fixable via those overrides; none via `npm audit fix` alone.
- **Files:** `package.json`, `package-lock.json`

## QA Results

- **Status:** PASS
- Overrides confirmed mocha-scoped (not global); lockfile clean with integrity hashes; orphaned `randombytes` removed.
- `npm audit` re-verified: 0 vulnerabilities.
- Engine floor of `serialize-javascript@7` (node >= 20) satisfied by `.nvmrc` node 22; both packages are dev-only, not bundled into the VSIX.
- Parser/discover/cache suites re-run: 125 passed. Host suite (47) passed during build; no source or test files changed since.
- No blocking findings; no advisories.
