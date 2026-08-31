import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  applyPalette, LivePreview, PREVIEW_DEBOUNCE_MS, ApplyOptions, removeApplied,
} from '../../src/apply';
import { toColorCustomizations } from '../../src/palette';
import { fakeContext, inspectColors, resetSettings, samplePalette } from './helpers';

const opts: ApplyOptions = {
  target: 'workspace',
  scopeToActiveTheme: false,
  includeSelectionForeground: false,
  setMinimumContrastRatio: false,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ansi(slot: number): string {
  return `#${slot.toString(16).padStart(2, '0')}aaaaaa`.slice(0, 7);
}

suite('LivePreview', () => {
  const ctx = fakeContext();

  setup(async () => {
    await resetSettings();
    await ctx.workspaceState.update('terminalThemeImport.ownedKeys', undefined);
  });

  suiteTeardown(async () => {
    await resetSettings();
  });

  test('cancel restores the pre-session snapshot, including empty', async () => {
    const preview = new LivePreview(ctx, opts);
    await applyPalette(ctx, samplePalette(), opts);
    assert.ok('terminal.background' in inspectColors('workspace'));

    await preview.cancel();
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });

  test('two schedules inside the debounce window apply only the second palette', async () => {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorCustomizations',
      { 'editor.foreground': '#abcdef' },
      vscode.ConfigurationTarget.Workspace,
    );

    const first = samplePalette({
      background: '#111111',
      cursor: '#ff0000',
      ansi: Array.from({ length: 16 }, (_, i) => ansi(i)),
    });
    const second = samplePalette({
      background: '#222222',
      cursor: undefined,
      ansi: Array.from({ length: 16 }, (_, i) => ansi(i + 1)),
    });

    const preview = new LivePreview(ctx, opts);
    preview.schedule(first);
    preview.schedule(second);
    await delay(PREVIEW_DEBOUNCE_MS + 50);

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['terminal.background'], '#222222');
    assert.ok(
      !('terminalCursor.foreground' in colors),
      'first palette cursor must not remain — that would mean both applies merged',
    );
    assert.strictEqual(colors['editor.foreground'], '#abcdef');
    assert.strictEqual(
      colors['terminal.foreground'],
      toColorCustomizations(second)['terminal.foreground'],
    );

    await preview.cancel();
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#abcdef');
    assert.ok(!('terminal.background' in inspectColors('workspace')));
  });

  test('stop() on accept prevents leftover apply after remove', async () => {
    const palette = samplePalette();
    const preview = new LivePreview(ctx, opts);
    preview.schedule(palette);
    preview.stop();
    await applyPalette(ctx, palette, opts);
    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    await delay(PREVIEW_DEBOUNCE_MS + 50);
    assert.ok(
      !('terminal.background' in inspectColors('workspace')),
      'pending preview must not re-apply after accept-then-remove',
    );
  });
});
