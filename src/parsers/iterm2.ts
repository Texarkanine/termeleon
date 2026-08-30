import { Palette, normalizeColor, fromFloatComponents } from '../palette';

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
        `<key>\\s*${channel} Component\\s*</key>\\s*<real>([-\\d.eE+]+)</real>`,
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

/**
 * Windows Terminal keeps every scheme in one settings.json under `schemes`,
 * so this returns many palettes from a single file.
 */
export function parseWindowsTerminal(text: string): { name: string; palette: Palette }[] {
  let doc: any;
  try {
    doc = JSON.parse(stripJsonComments(text));
  } catch {
    return [];
  }
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