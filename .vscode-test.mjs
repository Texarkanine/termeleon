import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@vscode/test-cli';

const here = path.dirname(fileURLToPath(import.meta.url));
// macOS unix-socket paths cap at ~103 chars; the worktree's .vscode-test/user-data is too long.
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-h-'));

export default defineConfig({
  files: 'out/test/host/**/*.test.js',
  workspaceFolder: path.join(here, 'test/host/fixtures/workspace'),
  launchArgs: [
    `--user-data-dir=${userDataDir}`,
    '--disable-extensions',
    '--disable-workspace-trust',
  ],
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
});
