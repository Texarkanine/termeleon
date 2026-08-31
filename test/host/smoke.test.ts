import * as assert from 'assert';
import * as vscode from 'vscode';

suite('host harness', () => {
  test('opens the fixture workspace', () => {
    const folders = vscode.workspace.workspaceFolders;
    assert.ok(folders && folders.length > 0, 'expected a workspace folder');
  });
});
