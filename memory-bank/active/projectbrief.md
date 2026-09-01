# Project Brief

## User Story

As a VS Code user importing terminal themes, when I remove an applied theme or cancel live preview in a workspace that had no prior settings, I want any empty `.vscode/settings.json` file and empty `.vscode/` directory to be deleted from disk so that no empty configuration files or folders remain in git status or source control.

## Use-Case(s)

### Use-Case 1: Cleaning up on Theme Removal in Workspace
When a theme was imported into workspace settings in a repository with no existing `.vscode/settings.json`, running "Remove Imported Terminal Theme" clears the settings. If `.vscode/settings.json` is left containing an empty JSON object `{}` (and no other configuration), the file is removed from disk. If the parent `.vscode/` directory is now empty, it is also removed.

### Use-Case 2: Live Preview Cancellation in Clean Workspace
When previewing themes in a workspace that had no prior `.vscode/settings.json`, canceling preview restores the pre-session snapshot (clearing the customizations). The resulting empty `.vscode/settings.json` and empty `.vscode/` folder are cleaned up from disk.

### Use-Case 3: Non-Empty Settings Preservation
If `.vscode/settings.json` contains other settings (e.g. `editor.tabSize`, `files.exclude`), or if `.vscode/` contains other files (e.g. `launch.json`, `tasks.json`), only the theme keys are removed and the non-empty file / directory are preserved.

## Requirements

1. When `removeApplied` or `restoreApply` runs with `target === 'workspace'`, check each workspace folder for `.vscode/settings.json`.
2. If `.vscode/settings.json` exists and parses to an empty object `{}` with no remaining keys:
   - Delete `.vscode/settings.json`.
   - If `.vscode/` has no other files remaining (ignoring `.DS_Store`), delete the `.vscode/` directory.
3. If `.vscode/settings.json` has other keys or `.vscode/` has other configuration files, preserve them.
4. Strictly apply only to workspace folders when `target === 'workspace'`; never delete global/user configuration.

## Constraints

1. Keep the vscode-free core boundary intact (core parsers/palette don't import vscode; disk cleanup helper is in vscode-bound shell `src/apply.ts`).
2. Robust error handling: all file operations wrapped in try-catch so disk permission or missing file errors never crash the command.

## Acceptance Criteria

1. Host tests verify that applying to workspace and removing applied palette deletes `.vscode/settings.json` and `.vscode/` when no other settings existed.
2. Host tests verify that canceling a `LivePreview` session in an empty workspace removes `.vscode/settings.json` and `.vscode/`.
3. Host tests verify that `.vscode/settings.json` is preserved when other settings exist, and `.vscode/` is preserved when other files (like `launch.json`) exist.
4. All parser and host test suites pass.
