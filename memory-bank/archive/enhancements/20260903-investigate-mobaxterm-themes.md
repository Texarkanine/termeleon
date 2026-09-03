---
task_id: investigate-mobaxterm-themes
complexity_level: 2
date: 2026-09-03
status: completed
---

# TASK ARCHIVE: MobaXterm Palettes and Alacritty Windows Mirror

## SUMMARY

Investigated where MobaXterm stores palettes on Windows, determined they are stored on disk in standard INI `[Colors]` blocks, and implemented MobaXterm palette parsing and filesystem discovery. In a follow-on rework to support Windows emulator mirroring, extended Alacritty discovery to scan `%APPDATA%\alacritty`, follow `[general].import` and top-level `import` configuration arrays, resolve imported theme files, and mark the active palette for mirroring. Finally, polished MobaXterm active detection based on PR review feedback so only root configuration files directly within default roots are marked active.

## REQUIREMENTS

- **MobaXterm Investigation & Support**:
  - Determine if MobaXterm palettes live on disk in parseable formats without vendoring upstream files or inspecting binaries.
  - Implement a parser converting `[Colors]` RGB decimal triples into `Palette`.
  - Discover default Windows roots (`USERPROFILE/Documents/MobaXterm`, `OneDrive/Documents/MobaXterm`, `APPDATA/MobaXterm`) and `extraDirectories` (`.ini`, `.mxtcolors`).
  - Mark only the first usable default-root `MobaXterm.ini` active; ignore `.mxtsessions`.
  - Document gaps: unused `DefaultColorScheme` indexes without RGB, per-session colors, and portable `-i` INI locations.
- **Alacritty Windows Mirror Rework**:
  - Scan `%APPDATA%\alacritty` on Windows in addition to Unix XDG/home paths.
  - Parse `[general].import` and top-level `import` arrays.
  - Resolve paths: `~/` from home/user profile, absolute Windows/POSIX paths unchanged, relative paths relative to the config file. Do not expand `%VAR%`.
  - Recognize only exact basename `alacritty.toml` as a configuration file; mark inline palettes active if usable, otherwise mark the last usable import active.
  - Ensure imported files outside `extraDirectories` are listed and deduplicated.
- **PR Polish**:
  - Restrict MobaXterm active detection to root configuration files directly inside the default root (`path.resolve(path.dirname(file)) === path.resolve(dir)`) so nested backup or theme-pack INIs cannot inadvertently become active.
  - Add terminal emulator OS compatibility table to `README.md` and `STORE.md`.

## IMPLEMENTATION

1. **Byte Component Helper & MobaXterm Parser (`src/palette.ts`, `src/parsers/mobaxterm.ts`):**
   - Added `fromByteComponents` in `src/palette.ts` to convert 0–255 integer RGB components to `#rrggbb`.
   - Created `src/parsers/mobaxterm.ts` (`parseMobaXterm`), parsing `[Colors]` section keys case-insensitively with British `Colour` key names (`ForegroundColour`, `BackgroundColour`, `CursorColour`, and 16 ANSI keys).
2. **Alacritty Import Parser Helpers (`src/parsers/toml.ts`):**
   - Added `alacrittyImports` supporting `[general].import` with fallback to top-level `import`.
   - Added `resolveAlacrittyImport` handling `~/`, `path.win32.isAbsolute`, `path.posix.isAbsolute`, and config-relative paths without environment variable expansion.
3. **Discovery Enhancements (`src/discover.ts`):**
   - Added `discoverMobaXterm` scanning default roots and `extraDirs` with deduplication via `realpathSync` and active detection restricted to root `MobaXterm.ini` directly inside default roots.
   - Updated `discoverAlacritty` to scan `%APPDATA%\alacritty`, collect exact-basename `alacritty.toml` configs before `isUsable`, follow imports with per-import try/catch error boundaries, and mark the active palette for mirroring.
   - Registered `mobaxterm` source in `package.json`, `src/extension.ts`, and `discoverThemes`.
4. **Documentation & Context:**
   - Updated `README.md`, `STORE.md`, `memory-bank/productContext.md`, and `memory-bank/systemPatterns.md`.
   - Recorded architectural and Windows path knowledge in SumMem.

## TESTING

- **TDD Test Suites (`test/parsers.test.ts`, `test/discover.test.ts`):**
   - Parser tests cover MobaXterm `[Colors]` RGB triples, comment handling, index-only rejection, and malformed triples.
   - Parser tests cover Alacritty `[general].import` / `import` precedence, unparseable TOML, `~/` resolution, config-relative resolution, Windows absolute paths, and literal `%VAR%` handling.
   - Discovery tests cover MobaXterm `USERPROFILE`, `ONEDRIVE`, and `APPDATA` roots, first-root-wins active flag, extraDirs `.mxtcolors` / `.ini`, ignoring `.mxtsessions`, and ignoring nested `MobaXterm.ini` in subdirectories.
   - Discovery tests cover Alacritty `APPDATA` import-only active marking, inline colors, last-usable import precedence, missing/malformed imports, extraDirs overlap deduplication, and non-config filename matching.
- **Verification:**
   - Automated parser & discovery suite passes: 73 parser + 24 discovery tests (`npm run test:parsers`).
   - Compilation passes clean (`npm run compile`).
   - Manual host verification: packaged VSIX tested on Windows host running Cursor; verified Alacritty active theme mirror applied successfully.
   - Niko QA and PR feedback evaluations completed with clean verdicts.

## LESSONS LEARNED

- **Technical:** On Windows, "Documents" does not always equal `%USERPROFILE%\Documents`. When Known Folder Move is active or folders are moved to other drives/OneDrive, `%USERPROFILE%\Documents` may point to a different or empty directory.
- **Technical:** A filename suffix match (`/alacritty\.toml$/i`) treats files like `extra-alacritty.toml` as configurations. Configuration file matching must use exact basename (`path.basename(file).toLowerCase() === 'alacritty.toml'`).
- **Technical:** Configuration files that only specify imports without inline colors fail `isUsable(palette)` checks. They must be tracked during discovery before usability filtering so their imports can be followed and activated.
- **Technical:** `walk()` traverses subdirectories, so active-detection heuristics on root config files must explicitly verify `path.resolve(path.dirname(file)) === path.resolve(dir)` to prevent nested backup or theme-pack files from falsely becoming active.

## PROCESS IMPROVEMENTS

- Reconciled preflight and QA feedback autonomously to catch edge cases (like unparseable import error boundaries and nested configuration active flags) before merging.

## TECHNICAL IMPROVEMENTS

- Future emulator format work can reuse `fromByteComponents` for PuTTY-family INI themes, and consider a unified path-resolution helper shared between Alacritty's `import` and Kitty's `include` directives.

## NEXT STEPS

- Merge PR #47.
- Future work: investigate Windows Known Folder API / registry resolution (`LastIniPath`) to seamlessly discover MobaXterm when Documents is moved to arbitrary non-standard drive letters outside OneDrive.
