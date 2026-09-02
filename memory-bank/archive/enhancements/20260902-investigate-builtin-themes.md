---
task_id: investigate-builtin-themes
complexity_level: 2
date: 2026-09-02
status: completed
---

# TASK ARCHIVE: Investigate Built-in Theme Support

## SUMMARY

Investigated built-in theme support across terminal emulators per Issue #36. Discovered and implemented reliable discovery and parsing for iTerm2's bundled presets via `ColorPresets.plist` in macOS application bundles and via `extraDirs`, with support for both `<real>` and `<string>` float representations. Documented clear technical boundaries across `README.md`, `STORE.md`, and persistent architecture files for emulators where themes or active profiles are compiled into binaries (WezTerm) or internal package defaults (Windows Terminal).

## REQUIREMENTS

- Investigate active theme and built-in theme detection across WezTerm, iTerm2, and Windows Terminal.
- For emulators where reliable, non-brittle discovery is possible without vendoring static copies or fragile binary reflection, integrate built-in themes into discovery and picker options.
- For emulators where themes are compiled into binaries or inaccessible defaults, document clearly in the user-facing README, Marketplace store description, and architecture docs that built-in presets do not appear without exported user theme files.
- Ensure all executable behavior follows TDD with high test coverage and zero linter/type errors.

## IMPLEMENTATION

1. **iTerm2 ColorPresets.plist Parser (`src/parsers/iterm2.ts`):**
   - Extended `parseItermColors` to parse float RGB color components formatted as either `<real>` or `<string>` XML tags (such as Tango presets).
   - Added `parseItermColorPresets` using balanced `<dict>` extraction to parse all top-level preset dictionaries from `ColorPresets.plist` into `{ name, palette }[]`.
2. **Theme Discovery (`src/discover.ts`):**
   - Updated `discoverIterm2` to scan `ColorPresets.plist` in macOS `/Applications/iTerm.app`, `~/Applications/iTerm.app`, and `iTerm2.app` variants.
   - Added `extraDirs` discovery for `ColorPresets.plist` across all platforms.
   - Preserved priority deduplication using a `seen` Set so user `.itermcolors` files take precedence over bundled presets with the same name.
3. **Documentation Updates:**
   - Updated `README.md`, `STORE.md`, `memory-bank/productContext.md`, and `memory-bank/systemPatterns.md` detailing discovery boundaries and active-theme detection rationale across emulators.

## TESTING

- **TDD Unit & Discovery Tests:**
  - `test/parsers.test.ts`: Added tests verifying float parsing with `<string>` values, multi-preset extraction from `ColorPresets.plist`, and resilient error handling for malformed/incomplete presets.
  - `test/discover.test.ts`: Added tests verifying `extraDirs` discovery of `ColorPresets.plist` (cross-platform) and darwin-gated macOS application bundle discovery with deduplication.
- **Verification & QA:**
  - Automated test suite: 65 parser/discovery tests + 37 extension host tests pass cleanly.
  - Niko QA review: verified completeness, regression safety, KISS/DRY/YAGNI principles, and vscode-free core boundaries. Status: PASS.
  - Compilation & packaging: `npm run compile` and `npm run package` (vsce) succeed with zero warnings/errors.

## LESSONS LEARNED

- **Technical:** iTerm2's `ColorPresets.plist` encodes some presets (e.g. Tango Light/Dark) with `<string>` floats rather than `<real>`. Plist parsing regexes should flexibly match `<(?:real|string)>` tags.
- **Technical:** When adding platform-specific discovery paths (e.g. macOS `/Applications`), always pair them with an `extraDirs`-based test path to ensure discovery logic is exercised on every CI operating system without needing synthetic platform mocks.
- **Process:** Checking application resource bundles (`.app/Contents/Resources/`) before concluding presets are compiled into binaries avoids premature descoping.

## PROCESS IMPROVEMENTS

- Semantic review / QA caught the existence of `ColorPresets.plist` early in the cycle, successfully steering the task from docs-only to full implementation.

## TECHNICAL IMPROVEMENTS

- Multi-preset container files (`ColorPresets.plist`, `settings.json`) fit cleanly into the discovery model by having parsers return `{ name, palette }[]` arrays that `discover.ts` uniformly normalizes into `DiscoveredTheme[]`.

## NEXT STEPS

- None. Task complete and verified.
