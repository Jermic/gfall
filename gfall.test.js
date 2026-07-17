import { execFile } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('fetches direct child Git repositories and ignores ordinary directories', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gfall-'));

  try {
    await execFileAsync('git', ['init', '--quiet', path.join(root, 'repo with spaces')]);
    await mkdir(path.join(root, 'ordinary-directory'));

    const { stdout } = await execFileAsync(
      process.execPath,
      [path.join(import.meta.dirname, 'gfall.js'), root],
      { env: { ...process.env, FORCE_COLOR: '0' } },
    );

    assert.match(stdout, /repo with spaces/);
    assert.doesNotMatch(stdout, /ordinary-directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
