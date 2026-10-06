---
task_id: windows-terminal-inbox-schemes
date: 2026-10-06
complexity_level: 2
---

# Reflection: Windows Terminal inbox schemes and mirror

## Summary

Windows Terminal discovery now reads inbox schemes from the install's `defaults.json` and marks the default profile's scheme active when `settings.json` omits `colorScheme`. The build matches the brief, and QA passed.

## Requirements vs Outcome

Every requirement landed. Custom schemes still replace an inbox palette of the same name. An explicit `colorScheme`, including a present value that does not name a scheme, still wins. The assumed name is the exported constant `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`, used only after `defaults.json` itself omits one. Nothing was descoped. The case-different name test (`Campbell` vs `campbell`) was a tighter lock on the case-insensitive replace the plan already required.

## Plan Accuracy

The sequence held: resolver, then discovery, then docs. The challenges that mattered showed up as tests rather than surprises: a present-but-unusable `colorScheme` must not fall through, and an assumed name with no loaded palette must not be marked active. Preflight's note to pin `source: 'explicit'` on unparseable user settings was the one plan gap, and it was a one-line test change.

## Build & QA Observations

The red runs failed on the new cases and left the old Windows Terminal reader green. QA passed with no findings. Host tests needed a writable `XDG_RUNTIME_DIR` on this WSL machine, which was already known.

## Insights

### Technical

- On Windows Terminal 1.24, `defaults.json` is a legacy `profiles` array whose default profile already sets `colorScheme`. The constant is not the path a normal install takes. A test whose inbox file names a scheme other than Campbell is what keeps the file, rather than the constant, as the source of the name.

### Process

- Nothing notable

### Million-Dollar Question

The shape we built is the one to keep. `activeWindowsTerminalScheme` stays a reader of one document and still returns no names when the key is absent. `resolveWindowsTerminalActiveScheme` is the only place that knows the inbox file and the constant. Merging the two JSON documents into one effective settings file would copy Windows Terminal's profile-list merge, which we do not own.
