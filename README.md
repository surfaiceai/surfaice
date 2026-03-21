# 🧊 Surfaice

**Describe your UI once. Agents navigate it. CI verifies it. Humans review it.**

Surfaice is an open standard for describing web UI structure in a markdown-like format (`.surfaice.md`). It's like `sitemap.xml` for interactive capabilities — but instead of listing pages for search engines, it describes what your app can *do* for AI agents.

```
robots.txt     → what bots can crawl
sitemap.xml    → what pages exist
llms.txt       → what the site is about
surfaice.md    → what the UI can do
```

> **Who is this for?** Developers building with AI coding tools (Cursor, Windsurf, Copilot) who need to keep their UI quality from degrading as features pile up.

## The Problem

Vibe coding (AI-assisted development) makes it easy to build new features — and trivially easy to break existing ones.

- **AI agents** burn thousands of tokens on screenshots and DOM trees to understand a page that could be described in 200 tokens
- **Developers** have no lightweight way to document "what this UI is" that stays in sync with reality
- **UI changes are invisible in PRs** — you can't review a UI change by reading a React diff

There's no standard for telling machines what your UI can do.

## How It Works

Surfaice has two modes — both powered by the same annotations in your components:

### 🤖 Runtime Mode — Live UI for Agents

Agents request the markdown version of any page and get a **live snapshot with real data**:

```
GET /settings
Accept: text/surfaice

→ Returns:

# /settings [auth-required]

## Profile Section
- [name] textbox "Display Name" → current: "Haosu Wu"
- [email] textbox "Email" (readonly) → shows: "haosu@example.com"
- [notifications] badge → shows: 3
- [save] button "Save Changes" → PUT /api/profile

## Danger Zone
- [delete] button "Delete Account" (destructive) → DELETE /api/account
```

~200 tokens. No screenshots. No DOM parsing. The agent knows exactly what's on the page and what it can do.

### 📄 Build Mode — Static Manifests for CI & PRs

At build time, Surfaice exports `.surfaice.md` files to your repo. CI diffs them to catch UI regressions:

```diff
# PR diff — instantly readable UI change review

  ## Profile Section
  - [name] textbox "Display Name"
- - [save] button "Save Changes" → PUT /api/profile
+ - [save] button "Save" → PUT /api/profile
+ - [cancel] button "Cancel" → navigates: /dashboard
  - [delete] button "Delete Account" (destructive)
```

Reviewers see exactly what changed in the UI — no clicking through the app, no screenshots.

## Quick Start

### 1. Install

```bash
npm install @surfaice/react @surfaice/next
```

### 2. Annotate Your Components

```tsx
import { ui } from '@surfaice/react'

function SettingsPage({ user }) {
  return (
    <ui.page route="/settings" states={['auth-required']}>
      <ui.section name="Profile">
        <ui.element id="name" type="textbox" label="Display Name"
          value={user.name} action="PUT /api/profile">
          <input value={user.name} onChange={handleChange} />
        </ui.element>
        <ui.element id="save" type="button" label="Save Changes"
          action="PUT /api/profile" result="toast 'Saved!'"
          <button onClick={handleSave}>Save Changes</button>
        </ui.element>
      </ui.section>
    </ui.page>
  )
}
```

In production, `<ui.*>` wrappers render nothing extra — zero overhead. They only activate when Surfaice is enabled.

### 3. Enable the Middleware

```ts
// next.config.ts
import { withSurfaice } from '@surfaice/next'

export default withSurfaice({
  enabled: true,          // master toggle
  mode: 'query',          // /settings?surfaice=true → markdown
})
```

### 4. Try It

```bash
# Human view (normal)
curl https://myapp.com/settings
# → HTML page

# Agent view (markdown)
curl https://myapp.com/settings?surfaice=true
# → Live .surfaice.md with real data
```

### 5. Add CI Protection

```bash
# Export static manifests
surfaice export

# Check for drift
surfaice check

# See what changed
surfaice diff
```

## The Toggle

Surfaice can be turned on/off and access-controlled:

```ts
withSurfaice({
  enabled: process.env.SURFAICE_ENABLED === 'true',
  mode: 'query',  // ?surfaice=true | 'header' | 'route'
})
```

See [docs](./docs/) for advanced configuration (auth, route restrictions, per-page overrides).

## Three Consumers, One Source

```
                @surfaice/react (annotations in your code)
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
       🤖 Agents    ✅ CI/CD    👀 Humans
       Live markdown  Drift       PR diffs
       with real data detection   readable UI changes
```

**Agents** hit the runtime endpoint and understand your UI in ~200 tokens — no screenshots, no DOM scraping, no guessing.

**CI** exports static manifests at build time and diffs against the committed version — any UI regression fails the build.

**Humans** review `.surfaice.md` changes in PRs like they review code — structural, clear, meaningful diffs.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@surfaice/react` | Annotation components + runtime data collection | 🚧 In progress |
| `@surfaice/next` | Next.js middleware, dev overlay, build export | 🚧 In progress |
| `@surfaice/format` | `.surfaice.md` parser and serializer | 🚧 In progress |
| `@surfaice/differ` | Structural diff engine | 📋 Planned |
| `@surfaice/cli` | CLI tool (`export`, `check`, `diff`) | 📋 Planned |
| `@surfaice/action` | GitHub Action for CI | 📋 Planned |

## Format Specification

See [spec/FORMAT.md](./spec/FORMAT.md) for the full `.surfaice.md` format spec.

## Why "Surfaice"?

**Surface** (what users interact with) + **AI** (who else consumes it) = **Surfaice**.

The web has standards for everything machines need to know — except what the UI can do:

| Standard | Purpose | For |
|----------|---------|-----|
| `robots.txt` | What bots can crawl | Search crawlers |
| `sitemap.xml` | What pages exist | Search engines |
| `llms.txt` | What the site is about | LLMs |
| **`surfaice.md`** | **What the UI can do** | **AI agents** |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT — free to use, modify, and distribute.

---

*Built by [surfaiceai](https://github.com/surfaiceai) — making the web's interactive surface readable by machines.*
