/**
 * Normalized terminal palette, independent of any emulator's file format.
 *
 * `ansi` is always 16 entries in the canonical order:
 *   0-7   black red green yellow blue magenta cyan white
 *   8-15  the bright variants of the same
 */
export interface Palette {
  ansi: (string | undefined)[];
  background?: string;
  foreground?: string;
  /** Color of the cursor block itself. */
  cursor?: string;
  /** Color of the glyph *underneath* the cursor. */
  cursorText?: string;
  selectionBackground?: string;
  selectionForeground?: string;
}

export interface DiscoveredTheme {
  /** Display name, usually the filename stem or an in-file scheme name. */
  name: string;
  /** Which emulator this came from: 'ghostty', 'kitty', ... */
  source: string;
  /** Absolute path of the file it was parsed from. */
  origin: string;
  /** True if this is the theme the emulator is currently configured to use. */
  active: boolean;
  /**
   * Dark or light half of a Ghostty `theme = dark:X,light:Y` line.
   * Absent for a single `theme = X` or a theme that is not currently selected.
   */
  appearance?: 'dark' | 'light';
  palette: Palette;
}

const ANSI_NAMES = [
  'Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White',
];

/**
 * Accepts the hex spellings that show up across emulator configs and returns
 * a canonical `#rrggbb`, or undefined if it isn't a color we understand.
 *
 *   #1d1f21   1d1f21   0x1d1f21   #abc   rgb:1d/1f/21
 */
export function normalizeColor(raw: string | undefined): string | undefined {
  if (!raw) { return undefined; }
  let v = raw.trim().replace(/^['"]|['"]$/g, '').trim();

  // Xresources / XParseColor form.
  const xparse = /^rgb:([0-9a-f]{1,4})\/([0-9a-f]{1,4})\/([0-9a-f]{1,4})$/i.exec(v);
  if (xparse) {
    const scale = (c: string) => c.slice(0, 2).padEnd(2, c[0]).toLowerCase();
    return `#${scale(xparse[1])}${scale(xparse[2])}${scale(xparse[3])}`;
  }

  v = v.replace(/^0x/i, '').replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(v)) {
    return `#${v.split('').map((c) => c + c).join('').toLowerCase()}`;
  }
  // Tolerate 8-digit (alpha) forms by dropping the alpha channel; VS Code
  // accepts #rrggbbaa but emulators disagree on channel order, so we don't guess.
  if (/^[0-9a-f]{8}$/i.test(v)) {
    return `#${v.slice(0, 6).toLowerCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(v)) {
    return `#${v.toLowerCase()}`;
  }
  return undefined;
}

/** Builds a #rrggbb from three 0..1 floats (iTerm2 plist component form). */
export function fromFloatComponents(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 255)
    .toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export interface MappingOptions {
  /**
   * Write `terminal.selectionForeground`. Off by default: setting it disables
   * the behavior where selected text keeps its own color, which some users
   * rely on for legibility.
   */
  includeSelectionForeground?: boolean;
}

/**
 * Projects a Palette onto VS Code's `workbench.colorCustomizations` keys.
 * Undefined slots are omitted rather than written as null, so a partial theme
 * file leaves the rest of the active VS Code theme intact.
 */
export function toColorCustomizations(
  p: Palette,
  opts: MappingOptions = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (key: string, value: string | undefined) => {
    if (value) { out[key] = value; }
  };

  put('terminal.background', p.background);
  put('terminal.foreground', p.foreground);

  ANSI_NAMES.forEach((name, i) => {
    put(`terminal.ansi${name}`, p.ansi[i]);
    put(`terminal.ansiBright${name}`, p.ansi[i + 8]);
  });

  // Ghostty's `cursor-color` is the block; VS Code names the same pixel after
  // the foreground of the cursor widget. `cursor-text` is the glyph under it,
  // which VS Code calls the cursor's background.
  put('terminalCursor.foreground', p.cursor);
  put('terminalCursor.background', p.cursorText);

  put('terminal.selectionBackground', p.selectionBackground);
  if (opts.includeSelectionForeground) {
    put('terminal.selectionForeground', p.selectionForeground);
  }

  return out;
}

/** Every key this tool is willing to own, for clean removal later. */
export function managedKeys(): string[] {
  const keys = [
    'terminal.background', 'terminal.foreground',
    'terminalCursor.foreground', 'terminalCursor.background',
    'terminal.selectionBackground', 'terminal.selectionForeground',
  ];
  for (const name of ANSI_NAMES) {
    keys.push(`terminal.ansi${name}`, `terminal.ansiBright${name}`);
  }
  return keys;
}

/** True if at least the 16 ANSI slots are populated. */
export function isUsable(p: Palette): boolean {
  return p.ansi.filter(Boolean).length >= 16;
}

/** Bracketed `workbench.colorCustomizations` keys for a dark/light workbench pair. */
export function pairScopes(darkTheme: string, lightTheme: string): { darkScope: string; lightScope: string } {
  return { darkScope: `[${darkTheme}]`, lightScope: `[${lightTheme}]` };
}

/**
 * Resolves pair scopes from a settings reader.
 * Must request `preferredDarkColorTheme` and `preferredLightColorTheme` only.
 */
export function preferredPairScopes(
  read: (key: string) => string | undefined,
): { darkScope: string; lightScope: string } {
  return pairScopes(
    read('preferredDarkColorTheme') ?? '',
    read('preferredLightColorTheme') ?? '',
  );
}

export function mergeColors(
  current: Record<string, any>,
  colors: Record<string, string>,
  scopeKey?: string,
): { next: Record<string, any>; ownedKeys: string[] } {
  const next = { ...current };
  if (scopeKey) {
    next[scopeKey] = { ...(current[scopeKey] ?? {}), ...colors };
    return {
      next,
      ownedKeys: Object.keys(colors).map((k) => `${scopeKey}.${k}`),
    };
  }
  Object.assign(next, colors);
  return { next, ownedKeys: Object.keys(colors) };
}

export function mergePairedColors(
  current: Record<string, any>,
  darkColors: Record<string, string>,
  lightColors: Record<string, string>,
  darkScope: string,
  lightScope: string,
): { next: Record<string, any>; ownedKeys: string[] } {
  const dark = mergeColors(current, darkColors, darkScope);
  const light = mergeColors(dark.next, lightColors, lightScope);
  return { next: light.next, ownedKeys: [...dark.ownedKeys, ...light.ownedKeys] };
}

/**
 * Removes previously owned keys from a colorCustomizations object so a later
 * apply cannot leave untracked scoped (or unscoped) leftovers.
 */
export function stripOwnedKeys(current: Record<string, any>, keys: string[]): Record<string, any> {
  const next = JSON.parse(JSON.stringify(current));
  for (const key of keys) {
    const scoped = /^(\[[^\]]+\])\.(.+)$/.exec(key);
    if (scoped) {
      const [, scope, inner] = scoped;
      if (next[scope] && inner in next[scope]) {
        delete next[scope][inner];
        if (Object.keys(next[scope]).length === 0) { delete next[scope]; }
      }
    } else if (key in next) {
      delete next[key];
    }
  }
  return next;
}