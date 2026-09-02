import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

import { DiscoveredTheme, Palette, toColorCustomizations, isUsable, normalizeColor, pairScopes, preferredPairScopes, mergeColors, mergePairedColors, stripOwnedKeys, restoreApplySnapshot } from '../src/palette';
import { discoverThemes, toGhosttyDiscovered, activeGhosttyPair, mirrorCandidates } from '../src/discover';
import { parseGhostty, activeGhosttyThemes } from '../src/parsers/ghostty';
import { parseKitty, parseXresources } from '../src/parsers/kitty';
import { parseAlacritty } from '../src/parsers/toml';
import { parseItermColors, parseItermColorPresets, parseWindowsTerminal, activeWindowsTerminalScheme, isWindowsTerminalSchemeActive } from '../src/parsers/iterm2';

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

test('parses iTerm2 .itermcolors with string component values', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Ansi 0 Color</key>
  <dict>
    <key>Red Component</key><string>0.1</string>
    <key>Green Component</key><string>0.2</string>
    <key>Blue Component</key><string>0.3</string>
  </dict>
  <key>Ansi 1 Color</key>
  <dict>
    <key>Red Component</key><real>0.8</real>
    <key>Green Component</key><real>0.1</real>
    <key>Blue Component</key><real>0.1</real>
  </dict>
  ${Array.from({ length: 14 }, (_, i) => `
  <key>Ansi ${i + 2} Color</key>
  <dict>
    <key>Red Component</key><string>0.5</string>
    <key>Green Component</key><string>0.5</string>
    <key>Blue Component</key><string>0.5</string>
  </dict>`).join('')}
  <key>Background Color</key>
  <dict>
    <key>Red Component</key><string>0</string>
    <key>Green Component</key><string>0</string>
    <key>Blue Component</key><string>0</string>
  </dict>
  <key>Foreground Color</key>
  <dict>
    <key>Red Component</key><string>1</string>
    <key>Green Component</key><string>1</string>
    <key>Blue Component</key><string>1</string>
  </dict>
</dict>
</plist>`;
  const p = parseItermColors(xml);
  assert.ok(isUsable(p));
  assert.strictEqual(p.ansi[0], '#1a334d');
  assert.strictEqual(p.ansi[1], '#cc1a1a');
  assert.strictEqual(p.background, '#000000');
  assert.strictEqual(p.foreground, '#ffffff');
});

test('parses iTerm2 ColorPresets.plist with multiple presets and real/string float components', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Preset Real</key>
  <dict>
    ${Array.from({ length: 16 }, (_, i) => `
    <key>Ansi ${i} Color</key>
    <dict>
      <key>Red Component</key><real>0.1</real>
      <key>Green Component</key><real>0.1</real>
      <key>Blue Component</key><real>0.1</real>
    </dict>`).join('')}
    <key>Background Color</key>
    <dict><key>Red Component</key><real>0</real><key>Green Component</key><real>0</real><key>Blue Component</key><real>0</real></dict>
    <key>Foreground Color</key>
    <dict><key>Red Component</key><real>1</real><key>Green Component</key><real>1</real><key>Blue Component</key><real>1</real></dict>
  </dict>
  <key>Preset String</key>
  <dict>
    ${Array.from({ length: 16 }, (_, i) => `
    <key>Ansi ${i} Color</key>
    <dict>
      <key>Red Component</key><string>0.2</string>
      <key>Green Component</key><string>0.2</string>
      <key>Blue Component</key><string>0.2</string>
    </dict>`).join('')}
    <key>Background Color</key>
    <dict><key>Red Component</key><string>0.1</string><key>Green Component</key><string>0.1</string><key>Blue Component</key><string>0.1</string></dict>
    <key>Foreground Color</key>
    <dict><key>Red Component</key><string>0.9</string><key>Green Component</key><string>0.9</string><key>Blue Component</key><string>0.9</string></dict>
  </dict>
</dict>
</plist>`;
  const presets = parseItermColorPresets(xml);
  assert.strictEqual(presets.length, 2);
  assert.strictEqual(presets[0].name, 'Preset Real');
  assert.ok(isUsable(presets[0].palette));
  assert.strictEqual(presets[0].palette.background, '#000000');
  assert.strictEqual(presets[1].name, 'Preset String');
  assert.ok(isUsable(presets[1].palette));
  assert.strictEqual(presets[1].palette.background, '#1a1a1a');
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

console.log('\ndiscovery');
test('extra directories are scanned for every walkable format, not only iterm2', () => {
  const extraDir = path.join(__dirname, 'fixtures', 'extra');
  const found = discoverThemes({ extraDirs: [extraDir] })
    .filter((t) => t.origin.startsWith(extraDir + path.sep));
  const names = (source: string) =>
    found.filter((t) => t.source === source).map((t) => t.name).sort();

  assert.deepStrictEqual(names('ghostty'), ['extra-ghostty']);
  assert.deepStrictEqual(names('kitty'), ['extra-kitty']);
  assert.deepStrictEqual(names('alacritty'), ['extra-alacritty']);
  assert.deepStrictEqual(names('wezterm'), ['extra-wezterm']);
  assert.deepStrictEqual(names('iterm2'), ['extra-iterm2']);
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
  assert.ok(wf.includes('npm run test:coverage') || wf.includes('npm run test:parsers'), 'must run parser tests or coverage');
  assert.ok(wf.includes('npm run compile'), 'must typecheck/bundle');
  assert.ok(wf.includes('npm run package'), 'must package a VSIX so vsce failures fail the PR');
  assert.ok(wf.includes('codecov/codecov-action'), 'must upload coverage to Codecov');
  assert.ok(wf.includes('CODECOV_TOKEN'), 'must use CODECOV_TOKEN secret');
});

test('publisher present', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { publisher?: string };
  assert.ok(typeof pkg.publisher === 'string' && pkg.publisher.length > 0, 'publisher is required for vsce package');
  assert.match(pkg.publisher, /^[a-z0-9][a-z0-9-]*$/);
});
test('package.json icon and publisher contract', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { icon?: string; publisher?: string };
  assert.strictEqual(pkg.publisher, 'texarkanine');
  assert.ok(typeof pkg.icon === 'string' && pkg.icon.length > 0, 'package.json must declare an icon');
  const iconPath = path.join(repoRoot, pkg.icon);
  assert.ok(fs.existsSync(iconPath), `icon file must exist at ${pkg.icon}`);
  const stat = fs.statSync(iconPath);
  assert.ok(stat.isFile() && stat.size >= 8, 'icon must be a non-empty file');
  const fileBytes = fs.readFileSync(iconPath);
  const header = fileBytes.subarray(0, 8);
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(header.equals(pngMagic), 'icon must be a valid PNG image');

  const vscodeignore = fs.readFileSync(path.join(repoRoot, '.vscodeignore'), 'utf8');
  const ignoreLines = vscodeignore.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  assert.ok(
    !ignoreLines.some((line) => line === pkg.icon || line === 'images/**' || line === 'images/'),
    'vscodeignore must not ignore icon or image directory',
  );
});
test('package script invokes vsce', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  const script = pkg.scripts?.package ?? '';
  assert.ok(script.includes('vsce package'), 'scripts.package must invoke vsce package');
  assert.ok(script.includes('--readme-path STORE.md'), 'scripts.package must specify --readme-path STORE.md');
});
test('store readme contract', () => {
  const storePath = path.join(repoRoot, 'STORE.md');
  assert.ok(fs.existsSync(storePath), 'STORE.md must exist at repo root');
  assert.ok(fs.statSync(storePath).size > 0, 'STORE.md must be a non-empty file');

  const vscodeignore = fs.readFileSync(path.join(repoRoot, '.vscodeignore'), 'utf8');
  const ignoreLines = vscodeignore.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  assert.ok(ignoreLines.includes('README.md'), 'vscodeignore must exclude README.md to avoid root VSIX collision');
  assert.ok(!ignoreLines.includes('STORE.md'), 'vscodeignore must not exclude STORE.md');
});
test('test:coverage script is declared in package.json', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  const script = pkg.scripts?.['test:coverage'] ?? '';
  assert.ok(script.includes('c8'), 'scripts.test:coverage must invoke c8');
  assert.ok(script.includes('lcov'), 'scripts.test:coverage must generate lcov report');
  assert.ok(script.includes('test:parsers'), 'scripts.test:coverage must run parser test suite');
});
test('vsce is a pinned devDependency', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { devDependencies?: Record<string, string> };
  assert.ok(
    pkg.devDependencies?.['@vscode/vsce'],
    '@vscode/vsce must be a devDependency so npm ci installs it',
  );
});
test('c8 is a pinned devDependency', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as { devDependencies?: Record<string, string> };
  assert.ok(
    pkg.devDependencies?.['c8'],
    'c8 must be a devDependency so npm ci installs it',
  );
});
test('release-please attaches a vsix when a release is created', () => {
  const wf = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'release-please.yaml'),
    'utf8',
  );
  assert.ok(/id:\s*release\b/.test(wf), 'release-please step must have id: release');
  assert.ok(wf.includes('release_created'), 'upload must gate on release_created');
  assert.ok(wf.includes('gh release upload'), 'must upload with gh');
  assert.ok(wf.includes('.vsix'), 'must upload a vsix');
});
test('release-please publishes to Open VSX when a release is created', () => {
  const wf = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'release-please.yaml'),
    'utf8',
  );
  assert.ok(wf.includes('publish-openvsx:'), 'must declare a separate publish-openvsx deployment job');
  assert.ok(wf.includes('environment:'), 'must declare an environment');
  assert.ok(wf.includes('open-vsx.org'), 'open-vsx publish must target open-vsx.org environment');
  assert.ok(wf.includes('OPENVSX_TOKEN'), 'open-vsx publish must use OPENVSX_TOKEN');
  assert.ok(wf.includes('ovsx publish'), 'open-vsx publish must invoke ovsx publish');
});
test('release-please does not publish to the Marketplace', () => {
  const wf = fs.readFileSync(
    path.join(repoRoot, '.github', 'workflows', 'release-please.yaml'),
    'utf8',
  );
  assert.ok(!wf.includes('vsce publish'), 'must not vsce publish');
  assert.ok(!wf.includes('VSCE_PAT'), 'must not use a Marketplace PAT');
});
test('vscodeignore keeps agent trees out of the vsix', () => {
  const ignore = fs.readFileSync(path.join(repoRoot, '.vscodeignore'), 'utf8');
  assert.ok(ignore.includes('.cursor/**'), 'must not ship Cursor agent rules/skills');
  assert.ok(ignore.includes('.summem/**'), 'must not ship SumMem store');
  assert.ok(ignore.includes('memory-bank/**'), 'must not ship the memory bank');
});
test('coverage artifacts are ignored by git and vsce packaging', () => {
  const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
  assert.ok(
    gitignore.split(/\r?\n/).some((line) => line.trim() === 'coverage/' || line.trim() === 'coverage'),
    '.gitignore must ignore coverage/',
  );
  const vscodeignore = fs.readFileSync(path.join(repoRoot, '.vscodeignore'), 'utf8');
  assert.ok(
    vscodeignore.split(/\r?\n/).some((line) => line.trim() === 'coverage/**' || line.trim() === 'coverage/'),
    '.vscodeignore must ignore coverage/**',
  );
});

console.log('\ntermeleon package and settings contract');
test('package.json declares termeleon identity, commands, and settings', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  ) as {
    name?: string;
    displayName?: string;
    repository?: { url?: string };
    keywords?: string[];
    contributes?: {
      commands?: Array<{ command: string; category: string }>;
      configuration?: { title: string; properties: Record<string, any> };
    };
  };

  assert.strictEqual(pkg.name, 'termeleon');
  assert.strictEqual(pkg.displayName, 'Termeleon');
  assert.strictEqual(pkg.repository?.url, 'https://github.com/Texarkanine/termeleon.git');
  assert.ok(pkg.keywords?.includes('ghostty'));
  assert.ok(pkg.keywords?.includes('kitty'));
  assert.ok(pkg.keywords?.includes('alacritty'));

  const commands = pkg.contributes?.commands ?? [];
  const expectedCommands = [
    'termeleon.import',
    'termeleon.importGlobal',
    'termeleon.importWorkspace',
    'termeleon.mirror',
    'termeleon.remove',
  ];
  for (const cmd of expectedCommands) {
    const entry = commands.find((c) => c.command === cmd);
    assert.ok(entry, `command ${cmd} must be contributed`);
    assert.strictEqual(entry?.category, 'Termeleon');
  }

  const props = pkg.contributes?.configuration?.properties ?? {};
  assert.strictEqual(pkg.contributes?.configuration?.title, 'Termeleon');
  assert.ok('termeleon.target' in props);
  assert.ok('termeleon.sources' in props);
  assert.ok('termeleon.extraDirectories' in props);
  assert.ok('termeleon.scopeToActiveTheme' in props);
  assert.ok('termeleon.setMinimumContrastRatio' in props);
  assert.ok('termeleon.includeSelectionForeground' in props);
  assert.ok('termeleon.livePreview' in props);
});

test('launch.json contract', () => {
  const file = path.join(repoRoot, '.vscode', 'launch.json');
  assert.ok(fs.existsSync(file), '.vscode/launch.json must exist');
  const launch = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    configurations?: Array<{
      name?: string;
      type?: string;
      request?: string;
      args?: string[];
      preLaunchTask?: string;
      outFiles?: string[];
    }>;
  };
  const extHost = launch.configurations?.find((c) => c.type === 'extensionHost');
  assert.ok(extHost, 'must define an extensionHost launch configuration');
  assert.strictEqual(extHost?.request, 'launch');
  assert.strictEqual(extHost?.preLaunchTask, 'npm: compile');
  assert.ok(extHost?.args?.includes('--extensionDevelopmentPath=${workspaceFolder}'));
});

test('tasks.json contract', () => {
  const file = path.join(repoRoot, '.vscode', 'tasks.json');
  assert.ok(fs.existsSync(file), '.vscode/tasks.json must exist');
  const tasks = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    tasks?: Array<{
      label?: string;
      type?: string;
      script?: string;
    }>;
  };
  const compileTask = tasks.tasks?.find(
    (t) => t.label === 'npm: compile' || (t.type === 'npm' && t.script === 'compile'),
  );
  assert.ok(compileTask, 'must define the npm: compile build task');
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
  const snap = { colors: paired.next, ownedKeys: paired.ownedKeys, minimumContrastRatio: 4.5 };
  const previewed = mergeColors(
    stripOwnedKeys(snap.colors, snap.ownedKeys),
    { 'terminal.background': '#222' },
  );
  const leaked = stripOwnedKeys(snap.colors, previewed.ownedKeys);
  assert.ok(darkScope in leaked, 'restoring colors alone leaves pair scopes unstrippable');

  const afterCancel = restoreApplySnapshot(snap);
  assert.deepStrictEqual(afterCancel.colors, snap.colors);
  assert.deepStrictEqual(afterCancel.ownedKeys, snap.ownedKeys);
  assert.strictEqual(afterCancel.minimumContrastRatio, 4.5);
  assert.notDeepStrictEqual(afterCancel.ownedKeys, previewed.ownedKeys);
  const next = stripOwnedKeys(afterCancel.colors, afterCancel.ownedKeys);
  assert.ok(!(darkScope in next));
  assert.ok(!(lightScope in next));
});

console.log(`\n${passed} passed\n`);