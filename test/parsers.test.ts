import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

import { toColorCustomizations, isUsable, normalizeColor } from '../src/palette';
import { parseGhostty, activeGhosttyThemes } from '../src/parsers/ghostty';
import { parseKitty, parseXresources } from '../src/parsers/kitty';
import { parseAlacritty } from '../src/parsers/toml';
import { parseItermColors, parseWindowsTerminal } from '../src/parsers/iterm2';

const fix = (name: string) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

console.log('\ncolor normalization');
test('accepts the spellings emulators actually use', () => {
  assert.strictEqual(normalizeColor('#DA4939'), '#da4939');
  assert.strictEqual(normalizeColor('da4939'), '#da4939');
  assert.strictEqual(normalizeColor('0x282828'), '#282828');
  assert.strictEqual(normalizeColor('"0x282828"'), '#282828');
  assert.strictEqual(normalizeColor('#abc'), '#aabbcc');
  assert.strictEqual(normalizeColor('rgb:1d/1f/21'), '#1d1f21');
  assert.strictEqual(normalizeColor('not a color'), undefined);
  assert.strictEqual(normalizeColor(undefined), undefined);
});

console.log('\nghostty');
test('parses the Broadcast theme into a complete palette', () => {
  const p = parseGhostty(fix('Broadcast'));
  assert.ok(isUsable(p), 'palette should have all 16 ANSI slots');
  assert.strictEqual(p.background, '#2b2b2b');
  assert.strictEqual(p.foreground, '#e6e1dc');
  assert.strictEqual(p.cursor, '#ffffff');
  assert.strictEqual(p.cursorText, '#c0bbb6');
  assert.strictEqual(p.selectionBackground, '#5a647e');
  assert.strictEqual(p.ansi[1], '#da4939');
  assert.strictEqual(p.ansi[11], '#ffff7c');
});

test('Broadcast maps to the exact VS Code block produced by hand', () => {
  const out = toColorCustomizations(parseGhostty(fix('Broadcast')));
  assert.deepStrictEqual(out, {
    'terminal.background': '#2b2b2b',
    'terminal.foreground': '#e6e1dc',
    'terminal.ansiBlack': '#000000',
    'terminal.ansiBrightBlack': '#585858',
    'terminal.ansiRed': '#da4939',
    'terminal.ansiBrightRed': '#ff7b6b',
    'terminal.ansiGreen': '#519f50',
    'terminal.ansiBrightGreen': '#83d182',
    'terminal.ansiYellow': '#ffd24a',
    'terminal.ansiBrightYellow': '#ffff7c',
    'terminal.ansiBlue': '#6d9cbe',
    'terminal.ansiBrightBlue': '#9fcef0',
    'terminal.ansiMagenta': '#d0d0ff',
    'terminal.ansiBrightMagenta': '#ffffff',
    'terminal.ansiCyan': '#6e9cbe',
    'terminal.ansiBrightCyan': '#a0cef0',
    'terminal.ansiWhite': '#ffffff',
    'terminal.ansiBrightWhite': '#ffffff',
    'terminalCursor.foreground': '#ffffff',
    'terminalCursor.background': '#c0bbb6',
    'terminal.selectionBackground': '#5a647e',
  });
});

test('omits selectionForeground unless explicitly opted in', () => {
  const p = parseGhostty(fix('Broadcast'));
  assert.ok(!('terminal.selectionForeground' in toColorCustomizations(p)));
  assert.strictEqual(
    toColorCustomizations(p, { includeSelectionForeground: true })['terminal.selectionForeground'],
    '#e6e1dc',
  );
});

test('reads plain and split dark/light theme declarations', () => {
  assert.deepStrictEqual(activeGhosttyThemes('theme = Broadcast'), { single: 'Broadcast' });
  assert.deepStrictEqual(
    activeGhosttyThemes('# comment\ntheme = dark:Broadcast,light:Ayu Light\n'),
    { dark: 'Broadcast', light: 'Ayu Light' },
  );
  assert.deepStrictEqual(activeGhosttyThemes('font-size = 13'), {});
});

test('ignores comment lines that begin with a hex-looking token', () => {
  const p = parseGhostty('# background = #ffffff\nbackground = #101010\npalette = 0=#000000');
  assert.strictEqual(p.background, '#101010');
});

console.log('\nkitty');
test('parses whitespace-separated conf', () => {
  const p = parseKitty(fix('tomorrow-night.conf'));
  assert.ok(isUsable(p));
  assert.strictEqual(p.background, '#1d1f21');
  assert.strictEqual(p.cursorText, '#1d1f21');
  assert.strictEqual(p.ansi[4], '#81a2be');
  assert.strictEqual(p.ansi[15], '#ffffff');
});

test('strips trailing inline comments without eating the hex', () => {
  const p = parseKitty([
    'color1 #cc6666  # red',
    'background #1d1f21',
  ].join('\n'));
  assert.strictEqual(p.ansi[1], '#cc6666');
  assert.strictEqual(p.background, '#1d1f21');
});

console.log('\nalacritty');
test('parses TOML with 0x-prefixed colors', () => {
  const p = parseAlacritty(fix('gruvbox.toml'));
  assert.ok(isUsable(p));
  assert.strictEqual(p.background, '#282828');
  assert.strictEqual(p.ansi[1], '#cc241d');
  assert.strictEqual(p.ansi[9], '#fb4934');
  assert.strictEqual(p.cursorText, '#282828');
});

console.log('\niterm2');
test('converts float components to hex', () => {
  const p = parseItermColors(fix('Sample.itermcolors'));
  assert.ok(isUsable(p));
  assert.strictEqual(p.ansi[0], '#000000');
  assert.strictEqual(p.ansi[1], '#ff0000');
  assert.strictEqual(p.background, '#2b2b2b');
  assert.strictEqual(p.foreground, '#ffffff');
});

console.log('\nwindows terminal');
test('extracts every scheme from one settings.json, comments and all', () => {
  const doc = `{
    // a comment
    "profiles": {},
    "schemes": [
      {
        "name": "Campbell",
        "background": "#0C0C0C", "foreground": "#CCCCCC", "cursorColor": "#FFFFFF",
        "black": "#0C0C0C", "red": "#C50F1F", "green": "#13A10E", "yellow": "#C19C00",
        "blue": "#0037DA", "purple": "#881798", "cyan": "#3A96DD", "white": "#CCCCCC",
        "brightBlack": "#767676", "brightRed": "#E74856", "brightGreen": "#16C60C",
        "brightYellow": "#F9F1A5", "brightBlue": "#3B78FF", "brightPurple": "#B4009E",
        "brightCyan": "#61D6D6", "brightWhite": "#F2F2F2"
      },
    ]
  }`;
  const schemes = parseWindowsTerminal(doc);
  assert.strictEqual(schemes.length, 1);
  assert.strictEqual(schemes[0].name, 'Campbell');
  assert.strictEqual(schemes[0].palette.ansi[5], '#881798', 'purple maps to magenta slot');
  assert.strictEqual(schemes[0].palette.ansi[13], '#b4009e');
});

console.log('\nxresources');
test('parses XParseColor rgb: form', () => {
  const doc = ['! comment', '*.background: rgb:1d/1f/21', '*.foreground: #c5c8c6']
    .concat(Array.from({ length: 16 }, (_, i) => `*.color${i}: #00000${(i % 10)}`))
    .join('\n');
  const p = parseXresources(doc);
  assert.ok(isUsable(p));
  assert.strictEqual(p.background, '#1d1f21');
  assert.strictEqual(p.ansi[3], '#000003');
});

console.log(`\n${passed} passed\n`);