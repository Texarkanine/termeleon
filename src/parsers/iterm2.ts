import { Palette, normalizeColor, fromFloatComponents, isUsable } from '../palette';

/**
 * iTerm2 `.itermcolors` is an XML plist whose top-level dict maps color names
 * to sub-dicts of 0..1 float components:
 *
 *   <key>Ansi 0 Color</key>
 *   <dict>
 *     <key>Red Component</key><real>0.0</real>
 *     ...
 *   </dict>
 *
 * Sub-dicts contain no further dicts, so a non-greedy match is safe here and
 * saves pulling in a full plist dependency.
 *
 * Caveat: iTerm2 records a `Color Space` per entry ("sRGB" or "Calibrated").
 * We treat the components as sRGB regardless. Calibrated-space themes will be
 * very slightly off, which is the same approximation most porting tools make.
 */
export function parseItermColors(text: string): Palette {
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  const entries = new Map<string, string>();
  const blockRe = /<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(text)) !== null) {
    const name = m[1].trim();
    const body = m[2];
    const comp = (channel: string): number | undefined => {
      const cm = new RegExp(
        `<key>\\s*${channel} Component\\s*</key>\\s*<(?:real|string)>([-\\d.eE+]+)<\\/(?:real|string)>`,
      ).exec(body);
      return cm ? parseFloat(cm[1]) : undefined;
    };
    const r = comp('Red'), g = comp('Green'), b = comp('Blue');
    if (r === undefined || g === undefined || b === undefined) { continue; }
    entries.set(name, fromFloatComponents(r, g, b));
  }

  for (let i = 0; i < 16; i++) {
    p.ansi[i] = entries.get(`Ansi ${i} Color`);
  }
  p.background = entries.get('Background Color');
  p.foreground = entries.get('Foreground Color');
  p.cursor = entries.get('Cursor Color');
  p.cursorText = entries.get('Cursor Text Color');
  p.selectionBackground = entries.get('Selection Color');
  p.selectionForeground = entries.get('Selected Text Color');

  return p;
}

/**
 * Parses an iTerm2 ColorPresets.plist XML document containing multiple
 * top-level color presets into individual named palettes.
 */
export function parseItermColorPresets(text: string): { name: string; palette: Palette }[] {
  const presets: { name: string; palette: Palette }[] = [];
  const dictMatch = /<plist[^>]*>\s*<dict>([\s\S]*)<\/dict>\s*<\/plist>/i.exec(text);
  const content = dictMatch ? dictMatch[1] : text;

  const keyRe = /<key>([^<]+)<\/key>/g;
  let m: RegExpExecArray | null;

  while ((m = keyRe.exec(content)) !== null) {
    const name = m[1].trim();
    const dictStart = content.indexOf('<dict>', m.index + m[0].length);
    if (dictStart === -1) { break; }

    let depth = 0;
    let pos = dictStart;
    let dictEnd = -1;

    while (pos < content.length) {
      const open = content.indexOf('<dict>', pos);
      const close = content.indexOf('</dict>', pos);
      if (close === -1) { break; }

      if (open !== -1 && open < close) {
        depth++;
        pos = open + 6;
      } else {
        depth--;
        pos = close + 7;
        if (depth === 0) {
          dictEnd = pos;
          break;
        }
      }
    }

    if (dictEnd !== -1) {
      const inner = content.substring(dictStart, dictEnd);
      const palette = parseItermColors(inner);
      if (isUsable(palette)) {
        presets.push({ name, palette });
      }
      keyRe.lastIndex = dictEnd;
    }
  }

  return presets;
}

/** Strips // and /* *\/ comments so JSON.parse can handle JSONC. */
export function stripJsonComments(text: string): string {
  let out = '';
  let inString = false, inLine = false, inBlock = false, escaped = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
      continue;
    }
    if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i++; }
      continue;
    }
    if (inString) {
      out += c;
      if (escaped) { escaped = false; }
      else if (c === '\\') { escaped = true; }
      else if (c === '"') { inString = false; }
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && next === '/') { inLine = true; i++; continue; }
    if (c === '/' && next === '*') { inBlock = true; i++; continue; }
    out += c;
  }
  // Trailing commas are legal in Windows Terminal's settings.json.
  return out.replace(/,(\s*[}\]])/g, '$1');
}

interface WtScheme {
  name?: string;
  [key: string]: any;
}

/** JSON.parse of Windows Terminal JSONC, or `undefined` if the document is unusable. */
function parseWindowsTerminalSettings(text: string): any | undefined {
  try {
    return JSON.parse(stripJsonComments(text));
  } catch {
    return undefined;
  }
}

function wtColorSchemeNames(value: unknown): string[] {
  if (typeof value === 'string') { return [value]; }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const names: string[] = [];
    for (const key of ['dark', 'light'] as const) {
      const n = (value as any)[key];
      if (typeof n === 'string') { names.push(n); }
    }
    return names;
  }
  return [];
}

/** `undefined` means inherit; an array (even empty) means colorScheme was present. */
function wtColorSchemesFrom(owner: unknown): string[] | undefined {
  if (owner == null || typeof owner !== 'object') { return undefined; }
  if (!('colorScheme' in owner)) { return undefined; }
  return wtColorSchemeNames((owner as any).colorScheme);
}

function wtProfileList(profiles: unknown): any[] {
  if (Array.isArray(profiles)) { return profiles; }
  if (profiles && typeof profiles === 'object' && Array.isArray((profiles as any).list)) {
    return (profiles as any).list;
  }
  return [];
}

function wtDefaultsSchemes(profiles: unknown): string[] {
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) { return []; }
  return wtColorSchemesFrom((profiles as any).defaults) ?? [];
}

/**
 * Windows Terminal keeps every scheme in one settings.json under `schemes`,
 * so this returns many palettes from a single file.
 */
export function parseWindowsTerminal(text: string): { name: string; palette: Palette }[] {
  const doc = parseWindowsTerminalSettings(text);
  if (!doc) { return []; }
  const schemes: WtScheme[] = Array.isArray(doc?.schemes) ? doc.schemes : [];

  const order = [
    'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white',
  ];
  const brightOrder = [
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
    'brightBlue', 'brightPurple', 'brightCyan', 'brightWhite',
  ];

  return schemes
    .filter((s) => typeof s?.name === 'string')
    .map((s) => {
      const p: Palette = { ansi: new Array(16).fill(undefined) };
      order.forEach((k, i) => { p.ansi[i] = normalizeColor(s[k]); });
      brightOrder.forEach((k, i) => { p.ansi[i + 8] = normalizeColor(s[k]); });
      p.background = normalizeColor(s.background);
      p.foreground = normalizeColor(s.foreground);
      p.cursor = normalizeColor(s.cursorColor);
      p.selectionBackground = normalizeColor(s.selectionBackground);
      return { name: s.name as string, palette: p };
    });
}

/**
 * True when a parsed scheme name is one of the in-use colorScheme names,
 * ignoring case the way Windows Terminal does.
 */
export function isWindowsTerminalSchemeActive(schemeName: string, activeNames: string[]): boolean {
  const key = schemeName.toLowerCase();
  return activeNames.some((n) => n.toLowerCase() === key);
}

/**
 * Reads the color scheme names Windows Terminal would apply to a new
 * default-profile tab: the default profile's `colorScheme` if set, otherwise
 * `profiles.defaults.colorScheme`. A string yields one name; a `{ dark, light }`
 * object yields both. A present non-string that is not that pair yields none
 * and does not inherit defaults.
 *
 * Per-profile schemes on non-default profiles are ignored. GUID comparison
 * against `defaultProfile` is case-insensitive. `profiles` may be the modern
 * `{ defaults, list }` object or a legacy array.
 */
export function activeWindowsTerminalScheme(text: string): string[] {
  const doc = parseWindowsTerminalSettings(text);
  if (!doc) { return []; }

  const profiles = doc.profiles;
  const defaultGuid = typeof doc.defaultProfile === 'string'
    ? doc.defaultProfile.toLowerCase()
    : undefined;

  if (defaultGuid) {
    const def = wtProfileList(profiles).find(
      (p) => typeof p?.guid === 'string' && p.guid.toLowerCase() === defaultGuid,
    );
    const fromProfile = wtColorSchemesFrom(def);
    if (fromProfile !== undefined) { return fromProfile; }
  }

  return wtDefaultsSchemes(profiles);
}