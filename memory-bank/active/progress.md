# Progress

Constrain Dependabot toolchain majors and align `@types/node` with Node 22.

**Complexity:** Level 1

## 2026-09-02 - BUILD - COMPLETE

* Work completed
    - Added dependabot ignore rules for typescript >=7.0.0 and @types/node >=23.0.0
    - Bumped @types/node to ^22.0.0 and refreshed package-lock.json
    - Added CI contract tests locking dependabot policy and @types/node/.nvmrc alignment
    - Full test suite, compile, and package passed locally
* Decisions made
    - Used version-range ignores (not blanket semver-major) so TS 6.x proposals remain possible
