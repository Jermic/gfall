# gfall

Fetch every direct child Git repository with a live concurrent task list,
aligned results, and each repository's latest commit date.

```bash
pnpm install
pnpm start
pnpm start ~/Documents/GitHub
```

To expose it as a shell command:

```bash
pnpm add -g gfall
gfall
gfall ~/Documents/GitHub
```

Or run it without installing:

```bash
pnpm dlx gfall
```

## Releasing

After configuring npm trusted publishing for `Jermic/gfall` and
`.github/workflows/publish.yml`, publish a version by updating `package.json`
and pushing the matching tag:

```bash
pnpm version patch
git push --follow-tags
```
