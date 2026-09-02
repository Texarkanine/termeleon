# Project Brief

## User Story

As a Windows user who looks at WSL through MobaXterm, I want Termeleon to either import MobaXterm palettes the same way it imports other emulator themes, or tell me plainly that those colors cannot be read, so I am not left wondering why MobaXterm is missing from the supported list.

## Use-Case(s)

### Import MobaXterm palettes if they live on disk

If MobaXterm stores ANSI palettes (user-chosen and/or built-in colorization options) in files Termeleon can parse, those palettes appear in the import picker and can be applied to the VS Code integrated terminal.

### Document an unreadable store

If those palettes live only inside the app — compiled defaults, a proprietary or binary store, registry blobs we cannot map, or similar — Termeleon does not ship a parser that cannot find them. The gap is recorded in the same places other in-scope format limits already live.

## Requirements

1. Investigate where MobaXterm keeps terminal palettes, including built-in colorization options, on a Windows install.
2. If palettes can be discovered and parsed from on-disk files without vendoring upstream colors or inspecting binary internals, add MobaXterm as a source following the existing parser-plus-discovery pattern.
3. If they cannot, document that as a known gap in user-facing docs and persistent architecture context, in the same style as Windows Terminal packaged defaults and WezTerm compiled schemes.
4. Do not change the `Palette` contract, apply path, or `extensionKind`.

## Constraints

1. Termeleon only reads theme files and addons already on disk (plus custom schemes already in a settings file). It does not invent or ship palettes.
2. Known-limit policy already excludes compiled-in presets and fragile binary reflection.
3. MobaXterm is a Windows application. Discovery, if any, runs on the local Windows filesystem (`extensionKind: ["ui"]`), which is the machine where MobaXterm actually lives even when the VS Code window is a WSL remote.
4. A new walkable format must take `extraDirs` the same way as Ghostty, kitty, Alacritty, WezTerm, and iTerm2. Fixed-path formats (Windows Terminal, Xresources) stay on fixed files.

## Acceptance Criteria

1. The investigation concludes with one of two shipped outcomes: MobaXterm palettes are discoverable in the picker from on-disk files, or the unreadable-store gap is documented in `README.md`, `STORE.md`, and persistent memory-bank context.
2. If a parser ships, it emits `Palette` from vscode-free core, is covered by parser and discovery tests, and does not grow a second VS Code mapping table.
3. If a parser does not ship, no MobaXterm origin appears in the picker, and the documented reason matches what the investigation found.

## Rework

Operator chose rework after Reflect: keep the shipped MobaXterm source, and add Alacritty active-theme detection so Mirror works on Windows.

### User Story

As a Windows user who already keeps Alacritty theme files on disk, I want Mirror to apply the theme Alacritty is actually configured to use, not only a file whose name happens to be `alacritty.toml`.

### Use-Case(s)

#### Mirror the imported Alacritty theme

`%APPDATA%\alacritty\alacritty.toml` is scanned. If it names a theme via `import` or `[general].import`, that imported file is the active Alacritty palette (last import that yields a usable palette wins, matching Alacritty merge order). Extra-directory copies of the same file are flagged active when the resolved path matches.

#### Config with inline colors still works

An `alacritty.toml` that itself has a usable `[colors]` table remains active, as today on Unix.

### Requirements

1. Discover Alacritty's Windows config directory: `%APPDATA%\alacritty`.
2. Parse `import` from both the top-level key and `[general].import`.
3. Resolve import paths the way Alacritty does: absolute, `~/` from the user profile, or relative to the config file. Do not expand `%VAR%` (Alacritty does not).
4. Mark the in-use theme `active` so Mirror can apply it. Do not change `Palette`, apply, or `extensionKind`.
5. Update README / STORE / persistent context so Alacritty is no longer described as "`alacritty.toml` assumed active" only.

### Constraints

1. Do not vendor Alacritty theme packs. extraDirectories already finds those files.
2. YAML Alacritty configs stay out of scope.
3. Missing import files are skipped, same as Alacritty.

### Acceptance Criteria

1. On a machine whose Alacritty config is `%APPDATA%\alacritty\alacritty.toml` with `[general].import` pointing at a usable theme `.toml`, Mirror applies that imported palette.
2. Unix default paths keep working. A usable inline `alacritty.toml` is still active.
3. Parser and discovery tests cover Windows APPDATA roots, `[general].import`, top-level `import`, missing imports, and last-usable-import wins.
