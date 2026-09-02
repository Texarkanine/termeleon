---
task_id: marketplace-store-readme
date: 2026-09-01
complexity_level: 2
---

# Reflection: marketplace-store-readme

## Summary

Created a dedicated, user-focused marketplace sales pitch in `STORE.md` and wired `vsce package` with `--readme-path STORE.md` alongside `.vscodeignore` exclusions for `README.md` and contract tests in `test/parsers.test.ts`.

## Requirements vs Outcome

Delivered all planned requirements. Marketplace packages now package `STORE.md` as the store-facing `extension/readme.md`, while GitHub repo visitors see `README.md` containing developer and test instructions. Packaging contract tests guard the configuration and prevent archive collisions.

## Plan Accuracy

The implementation plan accurately predicted the need to exclude `README.md` from `.vscodeignore` to avoid case-insensitive zip collisions and identified all necessary contract assertions.

## Build & QA Observations

Build executed smoothly following TDD red-green-verify steps. Initial QA caught a single documentation discrepancy in `memory-bank/techContext.md` where the packaging script description needed updating to mention `--readme-path STORE.md`. After updating `techContext.md`, QA passed cleanly.

## Insights

### Technical
- Passing `--readme-path <file>` to `vsce package` maps the custom markdown file to `extension/readme.md` inside the VSIX archive. Because `vsce` automatically attempts to include `README.md` from the root, `README.md` must be explicitly listed in `.vscodeignore` to avoid duplicate entries and case-insensitive filename collisions in the archive.

### Process
- Synchronizing persistent memory bank files (such as `techContext.md`) during the build phase when build commands/scripts change prevents documentation lag and QA round-trips.

### Million-Dollar Question
- The separation of user-facing store copy (`STORE.md`) from repository developer documentation (`README.md`) via build-time packaging flags is the standard, clean pattern supported by `vsce`.

---
