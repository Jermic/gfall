#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Listr } from 'listr2';

const execFileAsync = promisify(execFile);
const root = path.resolve(process.argv[2] ?? '.');

const entries = await readdir(root, { withFileTypes: true });
const repositories = [];
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

const tasks = new Listr(
  repositories.map(({ name, directory }) => ({
    title: name,
    task: async (_, task) => {
      const startedAt = performance.now();

      try {
        await execFileAsync(
          'git',
          ['-C', directory, 'fetch', '--all', '--prune'],
          { maxBuffer: 10 * 1024 * 1024 },
        );
        task.title = `${name} · synced · ${elapsed(startedAt)}`;
      } catch (error) {
        failed = true;
        task.title = `${name} · failed · ${elapsed(startedAt)}`;
        const detail = error.stderr?.trim().split('\n').at(-1) || error.message;
        throw new Error(detail);
      }
    },
  })),
  {
    concurrent: 8,
    exitOnError: false,
    rendererOptions: {
      collapseErrors: false,
      showErrorMessage: true,
    },
  },
);

console.log(`Fetching ${repositories.length} repositories from ${root}\n`);
await tasks.run();
if (failed) process.exitCode = 1;

function elapsed(startedAt) {
  return `${((performance.now() - startedAt) / 1000).toFixed(1)}s`;
}
