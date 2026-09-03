import { Palette, fromByteComponents } from '../palette';

const ANSI_KEYS = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'boldblack', 'boldred', 'boldgreen', 'boldyellow',
  'boldblue', 'boldmagenta', 'boldcyan', 'boldwhite',
];

/**
 * Keys and values from one INI section. Section names and keys are matched
 * case-insensitively. `;` and `#` comments, and anything outside the named
 * section, are ignored.
 */
function sectionKeys(text: string, section: string): Map<string, string> {
  const wanted = section.toLowerCase();
  const out = new Map<string, string>();
  let inSection = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) { continue; }
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      inSection = header[1].trim().toLowerCase() === wanted;
      continue;
    }
    if (!inSection) { continue; }
    const eq = line.indexOf('=');
    if (eq <= 0) { continue; }
    out.set(line.slice(0, eq).trim().toLowerCase(), line.slice(eq + 1).trim());
  }
  return out;
}

function parseRgb(value: string | undefined): string | undefined {
  if (!value) { return undefined; }
  const m = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/.exec(value);
  if (!m) { return undefined; }
  return fromByteComponents(Number(m[1]), Number(m[2]), Number(m[3]));
}

/**
 * MobaXterm INI `[Colors]` section. Named ANSI slots and cursor/fg/bg are
 * `r,g,b` decimal triples with British `Colour` keys.
 *
 *   [Colors]
 *   Black=1,2,3
 *   ForegroundColour=200,201,202
 */
export function parseMobaXterm(text: string): Palette {
  const keys = sectionKeys(text, 'Colors');
  const p: Palette = { ansi: new Array(16).fill(undefined) };
  ANSI_KEYS.forEach((key, i) => { p.ansi[i] = parseRgb(keys.get(key)); });
  p.foreground = parseRgb(keys.get('foregroundcolour'));
  p.background = parseRgb(keys.get('backgroundcolour'));
  p.cursor = parseRgb(keys.get('cursorcolour'));
  return p;
}
