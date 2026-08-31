import * as assert from 'assert';
import * as vscode from 'vscode';
import { DiscoveredTheme } from '../../src/palette';
import { MirrorCandidate } from '../../src/discover';
import { toItem, toMirrorItem, ensureTerminalVisible } from '../../src/extension';
import { samplePalette } from './helpers';

function makeTheme(overrides: Partial<DiscoveredTheme> = {}): DiscoveredTheme {
  return {
    name: 'Sample Theme',
    source: 'ghostty',
    origin: '/path/to/theme/sample',
    active: false,
    palette: samplePalette(),
    ...overrides,
  };
}

suite('picker items and terminal reveal', () => {
  test('toItem sets detail to origin path without block characters', () => {
    const theme = makeTheme({ origin: '/home/user/.config/ghostty/themes/nord' });
    const item = toItem(theme);

    assert.strictEqual(item.detail, '/home/user/.config/ghostty/themes/nord');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('toMirrorItem sets detail for pair candidate without block characters', () => {
    const dark = makeTheme({ name: 'Dark', origin: '/path/to/dark' });
    const light = makeTheme({ name: 'Light', origin: '/path/to/light' });
    const candidate: MirrorCandidate = { kind: 'pair', dark, light };

    const item = toMirrorItem(candidate);
    assert.strictEqual(item.detail, '/path/to/dark  ·  /path/to/light');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('toMirrorItem sets detail for single theme candidate without block characters', () => {
    const theme = makeTheme({ origin: '/path/to/single' });
    const candidate: MirrorCandidate = { kind: 'theme', theme };

    const item = toMirrorItem(candidate);
    assert.strictEqual(item.detail, '/path/to/single');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('ensureTerminalVisible shows a terminal', () => {
    ensureTerminalVisible();
    assert.ok(vscode.window.terminals.length > 0, 'expected at least one terminal to exist');
  });
});
