# Project Brief

## User Story

As a Windows user with both Alacritty and MobaXterm installed, I want Mirror to treat MobaXterm's applied palette as active (and ask which emulator when both are active), I want the compatibility matrices to show pick-vs-mirror honestly, and I want Import/Mirror to come up from a warm scan instead of blocking on a full disk walk every time.

## Use-Case(s)

### Use-Case 1: Mirror with two active emulators

Both Alacritty and MobaXterm have a detectable applied palette. Mirror presents the existing multi-candidate picker instead of silently applying Alacritty.

### Use-Case 2: MobaXterm marked in-use in the import list

A discoverable applied `MobaXterm.ini` is listed and flagged as in-use, matching what the docs already claim.

### Use-Case 3: Honest compatibility matrices

README and store listing show, per OS, whether an emulator can be picked, mirrored, both, or neither, with a legend under the table.

### Use-Case 4: Warm scan

The first Import or Mirror after a window loads does not wait on a cold disk walk if startup has already finished a scan. Subsequent commands in that window serve that scan immediately — they do not start another walk. A truly empty cache still waits. Changing `sources` or `extraDirectories` starts a new scan.

## Requirements

1. Mark MobaXterm's applied palette as active when it is discoverable, so Mirror includes it among candidates.
2. When more than one emulator reports an active theme, Mirror uses the existing multi-candidate picker (Alacritty vs MobaXterm, etc.) rather than silently choosing one.
3. Update the OS compatibility matrices in `README.md` and `STORE.md`: `✅` only for pick-and-mirror; `📝` for pick-but-not-mirror; `🪞` only if something can mirror but not pick. Legend under each table for symbols actually used.
4. Cache discovered themes in process memory. Commands serve the cache immediately; wait only when the cache is empty. Do not walk the disk on every command. Rescan when the window loads and when `sources` or `extraDirectories` change.
5. Start the first scan when the extension/window loads so the cache is usually warm before the user runs a command.

## Constraints

1. Discovery remains vscode-free (`src/discover.ts` / parsers must not import `vscode`). Cache/lifecycle belongs in the vscode-bound shell.
2. `extensionKind` stays `["ui"]`; scans still run on the local machine.
3. Do not invent palettes or scan MobaXterm dropdown indexes / `.mxtsessions` (existing format gaps stay).
4. Host tests must not rely on `npm test` / `test:host` in this WSL environment (Electron hangs on `/run/user/1000/*.sock`); `test:parsers` + `compile` is the valid local gate. Host tests still belong in the suite for CI/macOS.

## Acceptance Criteria

1. When MobaXterm's applied `[Colors]` is found, that theme is `active` and appears as in-use in the import picker.
2. When Alacritty and MobaXterm both have active palettes, Mirror asks which to apply instead of taking Alacritty alone.
3. README and STORE OS matrices and legends match the symbols specified above and match implemented pick/mirror capability.
4. With a populated cache, Import and Mirror do not wait on a full rescan.
5. `onStartupFinished` starts a scan; the first command waits only if that scan has not finished yet.
