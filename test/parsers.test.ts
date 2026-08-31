import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

import { DiscoveredTheme, Palette, toColorCustomizations, isUsable, normalizeColor, pairScopes, preferredPairScopes, mergeColors, mergePairedColors, stripOwnedKeys, restoreApplySnapshot } from '../src/palette';
import { toGhosttyDiscovered, activeGhosttyPair, mirrorCandidates } from '../src/discover';
import { parseGhostty, activeGhosttyThemes } from '../src/parsers/ghostty';
import { parseKitty, parseXresources } from '../src/parsers/kitty';
import { parseAlacritty } from '../src/parsers/toml';
import { parseItermColors, parseWindowsTerminal, activeWindowsTerminalScheme, isWindowsTerminalSchemeActive } from '../src/parsers/iterm2';

const fix = (name: string) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

const repoRoot = path.join(__dirname, '..');

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

test('defaults.colorScheme is the active scheme when the default profile has none', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: 'One Half Dark' },
      list: [{ guid: '{aaaa}', name: 'PowerShell' }],
    },
    schemes: [{ name: 'Campbell' }, { name: 'One Half Dark' }],
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), ['One Half Dark']);
});

test('default profile colorScheme wins over profiles.defaults', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: 'One Half Dark' },
      list: [{ guid: '{aaaa}', name: 'PowerShell', colorScheme: 'Campbell' }],
    },
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), ['Campbell']);
});

test('default profile without colorScheme inherits profiles.defaults', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: 'Campbell' },
      list: [{ guid: '{aaaa}', name: 'PowerShell' }, { guid: '{bbbb}', colorScheme: 'Tango Dark' }],
    },
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), ['Campbell']);
});

test('returns no names when no colorScheme is configured', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: { defaults: {}, list: [{ guid: '{aaaa}', name: 'PowerShell' }] },
    schemes: [{ name: 'Campbell' }],
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), []);
});

test('returns no names for empty or unparseable settings', () => {
  assert.deepStrictEqual(activeWindowsTerminalScheme(''), []);
  assert.deepStrictEqual(activeWindowsTerminalScheme('{'), []);
  assert.deepStrictEqual(activeWindowsTerminalScheme('{"profiles": }'), []);
});

test('legacy profiles array still finds the default profile scheme', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: [
      { guid: '{bbbb}', colorScheme: 'Tango Dark' },
      { guid: '{aaaa}', name: 'PowerShell', colorScheme: 'Campbell' },
    ],
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), ['Campbell']);
});

test('defaultProfile GUID match is case-insensitive', () => {
  const doc = JSON.stringify({
    defaultProfile: '{AA-BB}',
    profiles: {
      defaults: { colorScheme: 'One Half Dark' },
      list: [{ guid: '{aa-bb}', colorScheme: 'Campbell' }],
    },
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), ['Campbell']);
});

test('fixture settings.json names the in-use scheme and still parses every scheme', () => {
  const text = fix('windows-terminal-settings.json');
  assert.deepStrictEqual(activeWindowsTerminalScheme(text), ['Campbell']);
  const schemes = parseWindowsTerminal(text);
  assert.deepStrictEqual(schemes.map((s) => s.name), ['Campbell', 'One Half Dark']);
});

test('dark/light colorScheme on the default profile flags both names and does not inherit defaults', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: 'Campbell' },
      list: [{
        guid: '{aaaa}',
        colorScheme: { dark: 'One Half Dark', light: 'One Half Light' },
      }],
    },
  });
  assert.deepStrictEqual(
    activeWindowsTerminalScheme(doc),
    ['One Half Dark', 'One Half Light'],
  );
});

test('dark/light colorScheme on profiles.defaults flags both names', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: { dark: 'One Half Dark', light: 'One Half Light' } },
      list: [{ guid: '{aaaa}', name: 'PowerShell' }],
    },
  });
  assert.deepStrictEqual(
    activeWindowsTerminalScheme(doc),
    ['One Half Dark', 'One Half Light'],
  );
});

test('colorScheme present but not a string does not inherit defaults', () => {
  const doc = JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: { colorScheme: 'Campbell' },
      list: [{ guid: '{aaaa}', colorScheme: {} }],
    },
  });
  assert.deepStrictEqual(activeWindowsTerminalScheme(doc), []);
});

test('scheme name match for active is case-insensitive', () => {
  assert.ok(isWindowsTerminalSchemeActive('Campbell', ['campbell']));
  assert.ok(isWindowsTerminalSchemeActive('campbell', ['Campbell']));
  assert.ok(!isWindowsTerminalSchemeActive('Tango Dark', ['Campbell']));
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

console.log('\nci');
test('lockfile present', () => {
  assert.ok(
    fs.existsSync(path.join(repoRoot, 'package-lock.json')),
    'package-lock.json must exist so npm ci can run',
  );
});
test('.nvmrc pin', () => {
  const text = fs.readFileSync(path.join(repoRoot, '.nvmrc'), 'utf8');
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'));
  assert.ok(line, '.nvmrc must have a non-comment version line');
  assert.match(line!, /^\d+(\.\d+)*$/);
});
test('workflow contract', () => {
  const wf = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'ci.yaml'),
    'utf8',
  );
  assert.ok(wf.includes('pull_request'), 'must trigger on pull_request');
  assert.ok(wf.includes('push'), 'must trigger on push');
  assert.ok(/\binitialdev\b/.test(wf), 'must target initialdev');
  assert.ok(/\bmain\b/.test(wf), 'must target main');
  assert.ok(wf.includes('node-version-file'), 'setup-node must read .nvmrc');
  assert.ok(wf.includes('.nvmrc'), 'node-version-file must be .nvmrc');
  assert.ok(/cache:\s*"?npm"?/.test(wf), 'setup-node must cache npm');
  assert.ok(wf.includes('npm ci'), 'must install with npm ci');
  assert.ok(wf.includes('npm run test:parsers'), 'must run parser tests');
  assert.ok(wf.includes('npm run compile'), 'must typecheck/bundle');
});

console.log('\nghostty pair');
const dummyPalette = (): Palette => ({ ansi: Array.from({ length: 16 }, () => '#000000') });
const ghosttyEntry = (name: string) => ({ name, origin: `/themes/${name}`, palette: dummyPalette() });
function ghosttyTheme(
  name: string,
  extra: Partial<DiscoveredTheme> = {},
): DiscoveredTheme {
  return {
    name,
    source: 'ghostty',
    origin: `/themes/${name}`,
    active: false,
    palette: dummyPalette(),
    ...extra,
  };
}

test('stamps dark/light appearance from split active names', () => {
  const themes = toGhosttyDiscovered(
    [ghosttyEntry('Broadcast'), ghosttyEntry('Ayu Light'), ghosttyEntry('Other')],
    { dark: 'Broadcast', light: 'Ayu Light' },
  );
  const byName = Object.fromEntries(themes.map((t) => [t.name, t]));
  assert.strictEqual(byName['Broadcast'].appearance, 'dark');
  assert.strictEqual(byName['Broadcast'].active, true);
  assert.strictEqual(byName['Broadcast'].source, 'ghostty');
  assert.strictEqual(byName['Ayu Light'].appearance, 'light');
  assert.strictEqual(byName['Ayu Light'].active, true);
  assert.strictEqual(byName['Other'].appearance, undefined);
  assert.strictEqual(byName['Other'].active, false);
});

test('a single theme = name is active with no appearance', () => {
  const themes = toGhosttyDiscovered(
    [ghosttyEntry('Broadcast')],
    { single: 'Broadcast' },
  );
  assert.strictEqual(themes[0].active, true);
  assert.strictEqual(themes[0].appearance, undefined);
});

test('activeGhosttyPair returns both halves and rejects incomplete pairs', () => {
  const dark = ghosttyTheme('Broadcast', { active: true, appearance: 'dark' });
  const light = ghosttyTheme('Ayu Light', { active: true, appearance: 'light' });
  const pair = activeGhosttyPair([dark, light]);
  assert.ok(pair);
  assert.strictEqual(pair.dark.name, 'Broadcast');
  assert.strictEqual(pair.light.name, 'Ayu Light');

  assert.strictEqual(activeGhosttyPair([dark]), undefined);
  assert.strictEqual(
    activeGhosttyPair([ghosttyTheme('Broadcast', { active: true })]),
    undefined,
  );
  const kitty: DiscoveredTheme = {
    name: 'Tomorrow',
    source: 'kitty',
    origin: '/kitty/Tomorrow',
    active: true,
    palette: dummyPalette(),
  };
  assert.strictEqual(activeGhosttyPair([dark, kitty]), undefined);
});

test('mirrorCandidates collapses a Ghostty pair into one unit', () => {
  const dark = ghosttyTheme('Broadcast', { active: true, appearance: 'dark' });
  const light = ghosttyTheme('Ayu Light', { active: true, appearance: 'light' });
  const kitty: DiscoveredTheme = {
    name: 'Tomorrow',
    source: 'kitty',
    origin: '/kitty/Tomorrow',
    active: true,
    palette: dummyPalette(),
  };

  const justPair = mirrorCandidates([dark, light]);
  assert.strictEqual(justPair.length, 1);
  assert.strictEqual(justPair[0].kind, 'pair');
  if (justPair[0].kind === 'pair') {
    assert.strictEqual(justPair[0].dark.name, 'Broadcast');
    assert.strictEqual(justPair[0].light.name, 'Ayu Light');
  }

  const mixed = mirrorCandidates([dark, light, kitty]);
  assert.strictEqual(mixed.length, 2, 'pair plus kitty is two candidates, not three');
  assert.ok(mixed.some((c) => c.kind === 'pair'));
  assert.ok(mixed.some((c) => c.kind === 'theme' && c.theme.name === 'Tomorrow'));
  assert.ok(!mixed.some((c) => c.kind === 'theme' && c.theme.name === 'Broadcast'));
});

console.log('\ncolorCustomizations merge');
const OWNED_SCOPED = /^(\[[^\]]+\])\.(.+)$/;

test('pairScopes brackets preferred theme names', () => {
  assert.deepStrictEqual(pairScopes('One Dark Pro', 'GitHub Light'), {
    darkScope: '[One Dark Pro]',
    lightScope: '[GitHub Light]',
  });
});

test('preferredPairScopes reads only the preferred dark/light settings', () => {
  const seen: string[] = [];
  const scopes = preferredPairScopes((key) => {
    seen.push(key);
    if (key === 'preferredDarkColorTheme') { return 'One Dark Pro'; }
    if (key === 'preferredLightColorTheme') { return 'GitHub Light'; }
    if (key === 'colorTheme') { throw new Error('must not read colorTheme'); }
    return undefined;
  });
  assert.deepStrictEqual(seen, ['preferredDarkColorTheme', 'preferredLightColorTheme']);
  assert.deepStrictEqual(scopes, pairScopes('One Dark Pro', 'GitHub Light'));
});

test('mergeColors writes unscoped keys and preserves neighbors', () => {
  const { next, ownedKeys } = mergeColors(
    { 'editor.background': '#fff' },
    { 'terminal.background': '#111', 'terminal.foreground': '#eee' },
  );
  assert.strictEqual(next['editor.background'], '#fff');
  assert.strictEqual(next['terminal.background'], '#111');
  assert.deepStrictEqual(ownedKeys, ['terminal.background', 'terminal.foreground']);
  assert.ok(ownedKeys.every((k) => !OWNED_SCOPED.test(k)));
});

test('mergeColors nests a single scope without flattening', () => {
  const { next, ownedKeys } = mergeColors(
    { 'editor.background': '#fff' },
    { 'terminal.background': '#111' },
    '[Monokai]',
  );
  assert.strictEqual(next['editor.background'], '#fff');
  assert.ok(!('terminal.background' in next));
  assert.deepStrictEqual(next['[Monokai]'], { 'terminal.background': '#111' });
  assert.deepStrictEqual(ownedKeys, ['[Monokai].terminal.background']);
  assert.ok(OWNED_SCOPED.test(ownedKeys[0]));
});

test('mergePairedColors writes both scopes and no unscoped terminal keys', () => {
  const { darkScope, lightScope } = pairScopes('One Dark Pro', 'GitHub Light');
  const { next, ownedKeys } = mergePairedColors(
    { 'editor.background': '#fff' },
    { 'terminal.background': '#111', 'terminal.foreground': '#eee' },
    { 'terminal.background': '#fafafa', 'terminal.foreground': '#222' },
    darkScope,
    lightScope,
  );
  assert.strictEqual(next['editor.background'], '#fff');
  assert.ok(!Object.keys(next).some((k) => k.startsWith('terminal.')));
  assert.deepStrictEqual(next[darkScope]['terminal.background'], '#111');
  assert.deepStrictEqual(next[lightScope]['terminal.background'], '#fafafa');
  assert.ok(ownedKeys.includes(`${darkScope}.terminal.background`));
  assert.ok(ownedKeys.includes(`${lightScope}.terminal.foreground`));
  assert.ok(ownedKeys.every((k) => OWNED_SCOPED.test(k)));
  assert.ok(!ownedKeys.some((k) => k.includes('*Dark*') || k.includes('*Light*')));
});

test('stripOwnedKeys clears a prior pair so a later flat merge is not shadowed', () => {
  const { darkScope, lightScope } = pairScopes('One Dark Pro', 'GitHub Light');
  const paired = mergePairedColors(
    {},
    { 'terminal.background': '#111' },
    { 'terminal.background': '#fafafa' },
    darkScope,
    lightScope,
  );
  const stripped = stripOwnedKeys(paired.next, paired.ownedKeys);
  assert.ok(!(darkScope in stripped));
  assert.ok(!(lightScope in stripped));
  const flat = mergeColors(stripped, { 'terminal.background': '#222' });
  assert.strictEqual(flat.next['terminal.background'], '#222');
  assert.ok(!(darkScope in flat.next));
  assert.ok(!(lightScope in flat.next));
});

test('preview cancel restores owned keys with colors so the next strip clears pair scopes', () => {
  const { darkScope, lightScope } = pairScopes('One Dark Pro', 'GitHub Light');
  const paired = mergePairedColors(
    {},
    { 'terminal.background': '#111' },
    { 'terminal.background': '#fafafa' },
    darkScope,
    lightScope,
  );
  const snap = { colors: paired.next, ownedKeys: paired.ownedKeys };
  const previewed = mergeColors(
    stripOwnedKeys(snap.colors, snap.ownedKeys),
    { 'terminal.background': '#222' },
  );
  const leaked = stripOwnedKeys(snap.colors, previewed.ownedKeys);
  assert.ok(darkScope in leaked, 'restoring colors alone leaves pair scopes unstrippable');

  const afterCancel = restoreApplySnapshot(snap);
  assert.deepStrictEqual(afterCancel.colors, snap.colors);
  assert.deepStrictEqual(afterCancel.ownedKeys, snap.ownedKeys);
  assert.notDeepStrictEqual(afterCancel.ownedKeys, previewed.ownedKeys);
  const next = stripOwnedKeys(afterCancel.colors, afterCancel.ownedKeys);
  assert.ok(!(darkScope in next));
  assert.ok(!(lightScope in next));
});

console.log(`\n${passed} passed\n`);