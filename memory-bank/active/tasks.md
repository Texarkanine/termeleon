# Task: Retry a failed Windows Terminal lookup and use the discovery home

* Task ID: windows-terminal-inbox-schemes
* Complexity: Level 1
* Type: bug fix

## What broke

- A failed PowerShell lookup of Windows Terminal's install location was stored as an empty list for the rest of the window. Import and Mirror then had no inbox schemes until reload.
- Mirror resolved `~/.alacritty`, Alacritty `~/` imports, and the Xresources dotfiles through `HOME`, then `USERPROFILE`. Discovery uses `os.homedir()`. On Windows those directories can differ, so Mirror read the wrong files.

## What changed

- `resolveWindowsTerminalDefaultsLookup` leaves the memo unset when the lookup fails, and memoizes a successful empty result. `windowsTerminalDefaultsFiles` uses that result.
- `liveHome` now calls `homeDir`, which is `os.homedir()`.

## Files

- `src/discover.ts`
- `test/discover.test.ts`
