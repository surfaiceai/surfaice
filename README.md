# 🧊 Surfaice

**Describe your UI once. Agents navigate it. CI verifies it. Humans review it.**

> **Who is this for?** Developers building with AI coding tools (Cursor, Windsurf, Copilot) who need to keep their UI quality from degrading as features pile up.

## The Vision

The web has standards for everything machines need to know — except what the UI can do.

```
robots.txt     → what bots can crawl
sitemap.xml    → what pages exist
llms.txt       → what the site is about
surfaice.md    → what the UI can do
```

**Surfaice** makes your web UI readable by machines. Annotate your React components once, and your app can serve itself as a clean, token-efficient markdown document — alongside the normal HTML it already serves.

Same URL. Same parameters. Same authentication. Just a different content type.

```
GET /settings              → text/html       → normal page for humans
GET /settings              → text/surfaice   → markdown page for agents
    Accept: text/surfaice
```

## How It Works

### The Core Idea

Your app already knows what's on each page — the components, the labels, the actions. Surfaice captures that knowledge through lightweight annotations and makes it available as structured markdown.

**Step 1: Annotate your components**

```tsx
import { ui } from '@surfaice/react'

function SettingsPage({ user }) {
  return (
    <ui.page route="/settings">
      <ui.section name="Profile">
        <ui.element id="name" type="textbox" label="Display Name"
          value={user.name} action="PUT /api/profile">
          <input value={user.name} onChange={handleChange} />
        </ui.element>
        <ui.element id="save" type="button" label="Save Changes"
          action="PUT /api/profile" result="toast 'Saved!'">
          <button onClick={handleSave}>Save Changes</button>
        </ui.element>
      </ui.section>
    </ui.page>
  )
}
```

The `<ui.*>` wrappers render nothing extra in production — zero overhead. They just capture metadata about your UI.

**Step 2: Enable the middleware**

```ts
// next.config.ts
import { withSurfaice } from '@surfaice/next'

export default withSurfaice({
  enabled: process.env.SURFAICE_ENABLED === 'true',
})
```

**Step 3: That's it.** Your app now speaks two languages:

```bash
# Humans get HTML (as always)
curl https://myapp.com/settings
# → full interactive page

# Agents get markdown (new!)
curl -H "Accept: text/surfaice" https://myapp.com/settings
# → structured description with live data
```

### What Agents See

When an agent requests any page with `Accept: text/surfaice`, it gets a live snapshot — real data, real state, real actions:

```markdown
# /settings

## Profile
- [name] textbox "Display Name" → current: "Haosu Wu"
- [email] textbox "Email" (readonly) → shows: "haosu@example.com"
- [save] button "Save Changes" → PUT /api/profile → toast "Saved!"

## Danger Zone
- [delete] button "Delete Account" (destructive) → DELETE /api/account → confirms: modal
```

~150 tokens. No screenshots. No DOM parsing. No guessing.

The same URL with different auth returns different content — just like the HTML version. An admin sees admin elements. A logged-out user sees the login form. The markdown always mirrors reality.

### What CI Sees

At build time, Surfaice exports static `.surfaice.md` files. CI diffs them to catch regressions:

```diff
# PR diff — UI changes are instantly readable

  ## Profile
  - [name] textbox "Display Name"
- - [save] button "Save Changes" → PUT /api/profile
+ - [save] button "Save" → PUT /api/profile
+ - [cancel] button "Cancel" → navigates: /dashboard
```

No clicking through the app. No screenshot comparisons. Just readable structural diffs.

### What Humans See

The `.surfaice.md` files in your repo are valid Markdown — they render beautifully in GitHub, VSCode, or any markdown viewer. They're living documentation that never goes stale because they're generated from the same annotations that power the runtime.

## Install

```bash
npm install @surfaice/react @surfaice/next
```

## CLI

```bash
surfaice export    # Generate .surfaice.md from annotations (build time)
surfaice check     # Verify exported files match committed ones (CI)
surfaice diff      # Show what changed between last export and now
```

## Architecture

```
              @surfaice/react
              (annotations in your components)
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
     🤖 Runtime   📄 Build    👀 Repo
     Agents get    CI diffs    Humans read
     live markdown static files living docs
     via Accept    to catch    in PRs and
     header        regressions GitHub
```

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@surfaice/format` | `.surfaice.md` parser and serializer | 🚧 In progress |
| `@surfaice/react` | React annotation components | 🚧 In progress |
| `@surfaice/next` | Next.js middleware + build export | 📋 Planned |
| `@surfaice/differ` | Structural diff engine | 📋 Planned |
| `@surfaice/cli` | CLI tool (`export`, `check`, `diff`) | 📋 Planned |
| `@surfaice/action` | GitHub Action for CI | 📋 Planned |

## Format

See [spec/FORMAT.md](./spec/FORMAT.md) for the full `.surfaice.md` specification.

## Why "Surfaice"?

**Surface** (what users interact with) + **AI** (who else needs to understand it) = **Surfaice**.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT

---

*Making the web's interactive surface readable by machines.*
