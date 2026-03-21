# @surfaice/action

GitHub Action for detecting UI drift using Surfaice — automatically catch when your live UI diverges from committed `.surfaice.md` manifests.

## Usage

```yaml
# .github/workflows/ui-drift.yml
name: UI Drift Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  surfaice:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Start your app (or use a preview URL)
      - name: Start app
        run: pnpm dev &
        
      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Check for UI drift
        uses: surfaiceai/surfaice/packages/action@main
        with:
          base-url: 'http://localhost:3000'
          surfaice-dir: 'surfaice/'
          fail-on-drift: 'true'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `base-url` | ✅ | — | Base URL of the running app |
| `surfaice-dir` | | `surfaice/` | Directory with `.surfaice.md` files |
| `fail-on-drift` | | `true` | Fail the action if drift is detected |
| `output-format` | | `text` | Output format: `text` or `json` |

## Outputs

| Output | Description |
|--------|-------------|
| `drift-detected` | `"true"` or `"false"` |
| `drift-summary` | Human-readable summary of drift |
| `diff-json` | JSON-encoded diff results |

## Workflow with Surfaice CLI

```yaml
- name: Export UI manifests
  run: npx @surfaice/cli export -u http://localhost:3000 -r /settings /dashboard

- name: Commit if changed
  run: |
    git add surfaice/
    git diff --staged --quiet || git commit -m "chore: update surfaice manifests"
```
