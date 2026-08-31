import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  applyPalette, LivePreview, PREVIEW_DEBOUNCE_MS, ApplyOptions,
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

    const first = samplePalette({ background: '#111111', ansi: Array.from({ length: 16 }, (_, i) => ansi(i)) });
    const second = samplePalette({ background: '#222222', ansi: Array.from({ length: 16 }, (_, i) => ansi(i + 1)) });

    const preview = new LivePreview(ctx, opts);
    preview.schedule(first);
    preview.schedule(second);
    await delay(PREVIEW_DEBOUNCE_MS + 50);

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['terminal.background'], '#222222');
    assert.notStrictEqual(colors['terminal.background'], '#111111');
    assert.strictEqual(colors['editor.foreground'], '#abcdef');
    assert.strictEqual(
      colors['terminal.foreground'],
      toColorCustomizations(second)['terminal.foreground'],
    );

    await preview.cancel();
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#abcdef');
    assert.ok(!('terminal.background' in inspectColors('workspace')));
  });
});
