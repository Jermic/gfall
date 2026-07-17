#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Listr } from 'listr2';

const execFileAsync = promisify(execFile);
const root = path.resolve(process.argv[2] ?? '.');

const entries = await readdir(root, { withFileTypes: true });
const repositories: Array<{ name: string; directory: string }> = [];
let failed = false;

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const directory = path.join(root, entry.name);
  try {
    await access(path.join(directory, '.git'));
    repositories.push({ name: entry.name, directory });
  } catch {
    // Not a direct child Git repository.
  }
}

repositories.sort((a, b) => a.name.localeCompare(b.name));

if (repositories.length === 0) {
  console.log(`No Git repositories found in ${root}`);
  process.exit(0);
}

const nameWidth = Math.max(...repositories.map(({ name }) => name.length));
const tasks = new Listr<Record<string, never>, 'default', 'simple'>(
  repositories.map(({ name, directory }) => ({
    title: name.padEnd(nameWidth),
    task: async (_context, task) => {
      const startedAt = performance.now();

      try {
        await execFileAsync(
          'git',
          ['-C', directory, 'fetch', '--all', '--prune'],
          { maxBuffer: 10 * 1024 * 1024 },
        );
        const commitDate = await latestCommitDate(directory);
        task.title = formatResult(name, nameWidth, commitDate, 'synced', startedAt);
      } catch (error) {
        failed = true;
        task.title = formatResult(name, nameWidth, '----------', 'failed', startedAt);
        throw new Error(errorDetail(error));
      }
    },
  })),
  {
    concurrent: 8,
    exitOnError: false,
    renderer: 'default',
    rendererOptions: {
      collapseErrors: false,
      showErrorMessage: true,
    },
  },
);

console.log(`Fetching ${repositories.length} repositories from ${root}\n`);
await tasks.run();
if (failed) process.exitCode = 1;

async function latestCommitDate(directory: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', directory, 'log', '-1', '--format=%cs'],
    );
    return stdout.trim() || '----------';
  } catch {
    return '----------';
  }
}

function formatResult(
  name: string,
  width: number,
  commitDate: string,
  status: 'synced' | 'failed',
  startedAt: number,
): string {
  return `${name.padEnd(width)} · ${commitDate} · ${status} · ${elapsed(startedAt)}`;
}

function errorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const stderr = 'stderr' in error && typeof error.stderr === 'string'
    ? error.stderr.trim().split('\n').at(-1)
    : undefined;

  return stderr || error.message;
}

function elapsed(startedAt: number): string {
  return `${((performance.now() - startedAt) / 1000).toFixed(1)}s`;
}
