# @surfaice/cli

CLI tool for managing Surfaice UI manifests — export, check drift, and diff changes.

## Install

```bash
npm install -g @surfaice/cli
# or use without installing:
npx @surfaice/cli
```

## Commands

### `surfaice export`
Fetch routes from a running app and save `.surfaice.md` files.

```bash
surfaice export -u http://localhost:3000 -r /settings /dashboard -o ./surfaice/
```

### `surfaice check`
Compare committed `.surfaice.md` files against the live app. Exit code 1 on drift — CI-ready.

```bash
surfaice check -u http://localhost:3000 -d ./surfaice/
# ✅ /settings — 6 elements match
# ❌ /dashboard — DRIFT: 1 added, 1 changed
```

### `surfaice diff`
Show human-readable or JSON diff between committed and live.

```bash
surfaice diff -u http://localhost:3000 -d ./surfaice/
surfaice diff -u http://localhost:3000 -d ./surfaice/ --json
```

## CI Integration

```yaml
# .github/workflows/surfaice.yml
- name: Check for UI drift
  run: surfaice check -u ${{ env.APP_URL }} -d ./surfaice/
```
