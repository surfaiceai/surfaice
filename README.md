# 🧊 Surfaice

**Describe your UI once. Agents navigate it. CI verifies it. Humans review it.**

Surfaice is an open standard for describing web UI structure in a markdown-like format (`.surfaice.md`). It's like `sitemap.xml` for interactive capabilities — but instead of listing pages for search engines, it describes what your app can *do* for AI agents.

```
robots.txt     → what bots can crawl
sitemap.xml    → what pages exist
llms.txt       → what the site is about
surface.md     → what the UI can do
```

## The Problem

Vibe coding (AI-assisted development) makes it easy to build new features — and trivially easy to break existing ones. There's no standard, machine-readable format for describing *what a web app is supposed to do*.

- **Test scripts** (Playwright, Cypress) describe procedures, not structure — they break when UI changes
- **API specs** (OpenAPI) describe endpoints, not screens — they say nothing about what users see
- **Visual tools** (Storybook, Figma) describe components, not pages — too granular, too framework-coupled

## The Solution

A `.surfaice.md` file that describes your UI the way a wireframe describes a design — structurally, declaratively, readable by both humans and agents:

```markdown
# /settings [auth-required]

## Profile Section
- [avatar] image-upload "Profile Photo" → PUT /api/profile/avatar
- [name] textbox "Display Name" → current: {user.name}
- [email] textbox "Email" (readonly) → shows: {user.email}
- [save] button "Save Changes" → PUT /api/profile → toast "Saved!"

## Danger Zone
- [delete] button "Delete Account" (destructive) → confirms: modal → DELETE /api/account

## States
- [loading]: [save] disabled, shows spinner
- [error]: inline-error below [save] "Failed to save"
```

Three consumers, one file:
- **🤖 AI Agents** — understand your UI in ~200 tokens, no screenshots needed
- **✅ CI/CD** — detect UI drift automatically, fail PRs that break things
- **👀 Humans** — review UI changes as readable markdown diffs

## Quick Start

```bash
# Install
npm install -g surfaice

# Generate a manifest from any live URL
surfaice init https://myapp.com

# Verify your UI still matches the manifest
surfaice check

# See what changed
surfaice diff
```

## Two Modes

**External Crawler** — point at any URL, AI generates the `.surfaice.md`:
```bash
surfaice init https://myapp.com/settings
# → pages/settings.surfaice.md generated
```

**Framework Plugin** — annotate your components, manifest auto-generates from code:
```tsx
import { ui } from '@surfaice/react'

<ui.page route="/settings" states={['auth-required']}>
  <ui.section name="Profile">
    <ui.element id="name" type="textbox" label="Display Name">
      <input value={user.name} onChange={handleChange} />
    </ui.element>
  </ui.section>
</ui.page>
```

## Web Discovery

Sites can publish their UI manifest for agents to discover:

```
/.well-known/surfaice.md
```

Or via HTML meta tag:
```html
<meta name="surfaice" href="/surfaice.md">
```

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@surfaice/format` | `.surfaice.md` parser and serializer | 🚧 In progress |
| `@surfaice/crawler` | Playwright-based UI snapshot engine | 🚧 In progress |
| `@surfaice/differ` | Structural diff engine | 🚧 In progress |
| `@surfaice/cli` | CLI tool (`init`, `check`, `diff`) | 🚧 In progress |
| `@surfaice/react` | React annotation components | 📋 Planned |
| `@surfaice/next` | Next.js dev overlay + build export | 📋 Planned |
| `@surfaice/action` | GitHub Action for CI | 📋 Planned |

## Format Specification

See [spec/](./spec/) for the full `.surfaice.md` format specification.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT — free to use, modify, and distribute. We want this to become a community standard.

---

*Built by [surfaiceai](https://github.com/surfaiceai)*
