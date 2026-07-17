import { execFile } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('fetches repositories with aligned names and commit dates', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gfall-'));
  const shortName = 'a';
  const longName = 'repo with spaces';

  try {
    for (const name of [shortName, longName]) {
      const directory = path.join(root, name);
      await execFileAsync('git', ['init', '--quiet', directory]);
      await execFileAsync(
        'git',
        ['-C', directory, '-c', 'user.name=Test', '-c', 'user.email=test@example.com',
          'commit', '--quiet', '--allow-empty', '-m', 'Initial commit'],
        {
          env: {
            ...process.env,
            GIT_AUTHOR_DATE: '2024-01-02T00:00:00Z',
            GIT_COMMITTER_DATE: '2024-01-02T00:00:00Z',
          },
        },
      );
    }
    await mkdir(path.join(root, 'ordinary-directory'));

    const { stdout } = await execFileAsync(
      process.execPath,
      [path.join(import.meta.dirname, 'gfall.js'), root],
      { env: { ...process.env, FORCE_COLOR: '0' } },
    );

    assert.match(stdout, /✔ a {16}· 2024-01-02 · synced/);
    assert.match(stdout, /✔ repo with spaces · 2024-01-02 · synced/);
    assert.doesNotMatch(stdout, /ordinary-directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
