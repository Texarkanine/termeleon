import * as vscode from 'vscode';
import { DiscoveredTheme } from './palette';
import { discoverThemes, mirrorCandidates, MirrorCandidate } from './discover';
import {
  Target, ApplyOptions, applyPalette, applyPalettePair, removeApplied, LivePreview,
} from './apply';

const CONFIG = 'terminalThemeImport';

const SOURCE_LABELS: Record<string, string> = {
  'ghostty': 'Ghostty',
  'kitty': 'kitty',
  'alacritty': 'Alacritty',
  'wezterm': 'WezTerm',
  'iterm2': 'iTerm2',
  'windows-terminal': 'Windows Terminal',
  'xresources': 'Xresources',
};

function settings() {
  const c = vscode.workspace.getConfiguration(CONFIG);
  return {
    target: c.get<'ask' | 'global' | 'workspace'>('target', 'ask'),
    sources: c.get<string[]>('sources', []),
    extraDirectories: c.get<string[]>('extraDirectories', []),
    scopeToActiveTheme: c.get<boolean>('scopeToActiveTheme', false),
    setMinimumContrastRatio: c.get<boolean>('setMinimumContrastRatio', true),
    includeSelectionForeground: c.get<boolean>('includeSelectionForeground', false),
    livePreview: c.get<boolean>('livePreview', true),
  };
}

function applyOptions(target: Target): ApplyOptions {
  const s = settings();
  return {
    target,
    scopeToActiveTheme: s.scopeToActiveTheme,
    setMinimumContrastRatio: s.setMinimumContrastRatio,
    includeSelectionForeground: s.includeSelectionForeground,
  };
}

async function resolveTarget(forced?: Target): Promise<Target | undefined> {
  if (forced) { return forced; }
  const configured = settings().target;
  if (configured === 'global' || configured === 'workspace') { return configured; }

  const hasWorkspace = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
  if (!hasWorkspace) { return 'global'; }

  const choice = await vscode.window.showQuickPick(
    [
      {
        label: '$(globe) User settings',
        description: 'applies everywhere',
        detail: 'Writes to your global settings.json.',
        value: 'global' as Target,
      },
      {
        label: '$(root-folder) Workspace settings',
        description: 'this project only',
        detail: 'Writes to .vscode/settings.json in this workspace.',
        value: 'workspace' as Target,
      },
    ],
    { title: 'Where should the terminal theme be written?', ignoreFocusOut: true },
  );
  return choice?.value;
}

async function collect(): Promise<DiscoveredTheme[]> {
  const s = settings();
  return vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: 'Scanning for terminal themes…' },
    async () => discoverThemes({
      sources: s.sources.length ? s.sources : undefined,
      extraDirs: s.extraDirectories,
    }),
  );
}

interface ThemeItem extends vscode.QuickPickItem {
  theme: DiscoveredTheme;
}

/** A row of colored blocks so the palette is legible before applying it. */
function swatch(theme: DiscoveredTheme): string {
  return theme.palette.ansi.slice(0, 8).map((c) => (c ? '\u2588' : ' ')).join('');
}

function toItem(theme: DiscoveredTheme): ThemeItem {
  const source = SOURCE_LABELS[theme.source] ?? theme.source;
  return {
    label: theme.active ? `$(check) ${theme.name}` : theme.name,
    description: theme.active ? `${source} · in use` : source,
    detail: `${swatch(theme)}  ${theme.origin}`,
    theme,
  };
}

interface MirrorItem extends vscode.QuickPickItem {
  candidate: MirrorCandidate;
}

function toMirrorItem(candidate: MirrorCandidate): MirrorItem {
  if (candidate.kind === 'pair') {
    return {
      label: `$(check) ${candidate.dark.name} / ${candidate.light.name}`,
      description: 'Ghostty · dark/light',
      detail: `${swatch(candidate.dark)}  ${candidate.dark.origin}  ·  ${swatch(candidate.light)}  ${candidate.light.origin}`,
      candidate,
    };
  }
  return { ...toItem(candidate.theme), candidate };
}

/**
 * Shows the picker with optional live preview.
 *
 * Preview writes real settings, so the pre-picker colors *and* owned keys
 * are captured up front and both restored if the user backs out.
 */
async function pickAndApply(
  ctx: vscode.ExtensionContext,
  themes: DiscoveredTheme[],
  target: Target,
): Promise<void> {
  const opts = applyOptions(target);
  const preview = settings().livePreview;
  const session = preview ? new LivePreview(ctx, opts) : undefined;

  const picked = await new Promise<DiscoveredTheme | undefined>((resolve) => {
    const qp = vscode.window.createQuickPick<ThemeItem>();
    qp.items = themes.map(toItem);
    qp.title = `Import terminal theme → ${target === 'global' ? 'user' : 'workspace'} settings`;
    qp.placeholder = `${themes.length} themes found. Arrow keys preview, Enter applies.`;
    qp.matchOnDescription = true;
    qp.matchOnDetail = true;
    qp.ignoreFocusOut = true;

    let accepted = false;

    if (session) {
      qp.onDidChangeActive((active) => {
        const item = active[0];
        if (!item) { return; }
        session.schedule(item.theme.palette);
      });
    }

    qp.onDidAccept(() => {
      accepted = true;
      resolve(qp.selectedItems[0]?.theme);
      qp.hide();
    });

    qp.onDidHide(async () => {
      if (session) {
        if (accepted) { session.stop(); }
        else { await session.cancel(); }
      }
      qp.dispose();
      if (!accepted) { resolve(undefined); }
    });

    qp.show();
  });

  if (!picked) { return; }

  await applyPalette(ctx, picked.palette, opts);
  const where = target === 'global' ? 'user settings' : 'workspace settings';
  vscode.window.showInformationMessage(
    `Applied "${picked.name}" from ${SOURCE_LABELS[picked.source] ?? picked.source} to ${where}.`,
  );
}

async function commandImport(ctx: vscode.ExtensionContext, forced?: Target) {
  const target = await resolveTarget(forced);
  if (!target) { return; }

  const themes = await collect();
  if (themes.length === 0) {
    const action = await vscode.window.showWarningMessage(
      'No terminal themes found on this machine.',
      'Open settings',
    );
    if (action) {
      vscode.commands.executeCommand('workbench.action.openSettings', `${CONFIG}.extraDirectories`);
    }
    return;
  }
  await pickAndApply(ctx, themes, target);
}

/** Applies whatever theme the emulator itself is currently configured to use. */
async function commandMirror(ctx: vscode.ExtensionContext) {
  const target = await resolveTarget();
  if (!target) { return; }

  const active = (await collect()).filter((t) => t.active);
  if (active.length === 0) {
    vscode.window.showWarningMessage(
      'Could not determine an active theme from any installed terminal. Use "Import Terminal Theme" to pick one.',
    );
    return;
  }

  const candidates = mirrorCandidates(active);
  let chosen = candidates[0];
  if (candidates.length > 1) {
    const pick = await vscode.window.showQuickPick(candidates.map(toMirrorItem), {
      title: 'Several terminals report an active theme',
      ignoreFocusOut: true,
    });
    if (!pick) { return; }
    chosen = pick.candidate;
  }

  const opts = applyOptions(target);
  if (chosen.kind === 'pair') {
    await applyPalettePair(ctx, chosen.dark.palette, chosen.light.palette, opts);
    vscode.window.showInformationMessage(
      `Mirrored Ghostty dark/light pair "${chosen.dark.name}" / "${chosen.light.name}".`,
    );
    return;
  }

  await applyPalette(ctx, chosen.theme.palette, opts);
  vscode.window.showInformationMessage(
    `Mirrored "${chosen.theme.name}" from ${SOURCE_LABELS[chosen.theme.source] ?? chosen.theme.source}.`,
  );
}

async function commandRemove(ctx: vscode.ExtensionContext) {
  const target = await resolveTarget();
  if (!target) { return; }

  let result = await removeApplied(ctx, target, false);

  if (result.removed === 0) {
    const confirm = await vscode.window.showWarningMessage(
      'No record of a theme applied here. Remove all terminal color keys instead? This also clears terminal colors you set by hand.',
      { modal: true },
      'Remove all',
    );
    if (confirm !== 'Remove all') { return; }
    result = await removeApplied(ctx, target, true);
  }

  vscode.window.showInformationMessage(
    `Removed ${result.removed} terminal color ${result.removed === 1 ? 'key' : 'keys'}.`,
  );
}

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(`${CONFIG}.import`, () => commandImport(ctx)),
    vscode.commands.registerCommand(`${CONFIG}.importGlobal`, () => commandImport(ctx, 'global')),
    vscode.commands.registerCommand(`${CONFIG}.importWorkspace`, () => commandImport(ctx, 'workspace')),
    vscode.commands.registerCommand(`${CONFIG}.mirror`, () => commandMirror(ctx)),
    vscode.commands.registerCommand(`${CONFIG}.remove`, () => commandRemove(ctx)),
  );
}

export function deactivate() { /* nothing to tear down */ }