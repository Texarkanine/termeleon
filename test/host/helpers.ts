import * as vscode from 'vscode';
import { Palette } from '../../src/palette';

function mem(): vscode.Memento {
  const data = new Map<string, unknown>();
  return {
    keys: () => [...data.keys()],
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      if (data.has(key)) { return data.get(key) as T; }
      return defaultValue;
    },
    update: async (key: string, value: unknown) => {
      if (value === undefined) { data.delete(key); }
      else { data.set(key, value); }
    },
  };
}

/** ExtensionContext double: only globalState / workspaceState are real enough for owned keys. */
export function fakeContext(): vscode.ExtensionContext {
  return {
    globalState: mem(),
    workspaceState: mem(),
  } as unknown as vscode.ExtensionContext;
}

/** 16 ANSI slots plus a few semantics. Pass overrides to drop or replace fields. */
export function samplePalette(overrides: Partial<Palette> = {}): Palette {
  const ansi: string[] = [];
  for (let i = 0; i < 16; i++) {
    ansi.push(`#${(i * 16).toString(16).padStart(2, '0')}0000`);
  }
  return {
    ansi,
    background: '#111111',
    foreground: '#eeeeee',
    cursor: '#ff0000',
    cursorText: '#00ff00',
    selectionBackground: '#0000ff',
    selectionForeground: '#ffffff',
    ...overrides,
  };
}

export function inspectColors(target: 'global' | 'workspace'): Record<string, any> {
  const inspected = vscode.workspace.getConfiguration('workbench').inspect<Record<string, any>>('colorCustomizations');
  const raw = target === 'global' ? inspected?.globalValue : inspected?.workspaceValue;
  return raw ? JSON.parse(JSON.stringify(raw)) : {};
}

export async function resetSettings(): Promise<void> {
  const workbench = vscode.workspace.getConfiguration('workbench');
  const term = vscode.workspace.getConfiguration('terminal.integrated');
  await workbench.update('colorCustomizations', undefined, vscode.ConfigurationTarget.Workspace);
  await workbench.update('colorCustomizations', undefined, vscode.ConfigurationTarget.Global);
  await term.update('minimumContrastRatio', undefined, vscode.ConfigurationTarget.Workspace);
  await term.update('minimumContrastRatio', undefined, vscode.ConfigurationTarget.Global);
}
