# gfall

Fetch all direct child Git repositories concurrently from one clean terminal
view.

```text
Fetching 3 repositories from /Users/jermic/Documents/GitHub

✔ hermes-agent · 2026-07-17 · synced · 5.7s
✔ openclaw     · 2026-07-16 · synced · 9.8s
✔ pi           · 2026-07-15 · synced · 3.2s
```

Each repository runs:

```bash
git fetch --all --prune
```

Results include the current `HEAD` commit date. Repository names are aligned,
fetches run with a concurrency of eight, and failures produce a non-zero exit
code.

## Install

Requires Node.js 22 or newer.

```bash
pnpm add -g gfall
```

Update an existing global installation:

```bash
pnpm update -g gfall
```

Or run it without installing:

```bash
pnpm dlx gfall
```

## Usage

Fetch repositories in the current directory:

```bash
gfall
```

Or provide a parent directory:

```bash
gfall ~/Documents/GitHub
```

Only direct child directories containing `.git` are included.

## Development

```bash
pnpm install
pnpm start ~/Documents/GitHub
pnpm test
```

## Releasing

Configure npm Trusted Publisher for GitHub Actions:

| Field | Value |
| --- | --- |
| Organization or user | `Jermic` |
| Repository | `gfall` |
| Workflow filename | `publish.yml` |
| Environment | Leave empty |
| Allowed action | `npm publish` |

Then create a version commit and matching tag:

```bash
pnpm version patch
git push origin main --follow-tags
```

Regular branch pushes do not publish. Tags matching `v*` trigger
`.github/workflows/publish.yml`, which verifies that the tag matches the
version in `package.json` before publishing to npm.
