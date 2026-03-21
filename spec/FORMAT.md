# Surfaice Format Specification v1

## Overview

A `.surfaice.md` file is a valid Markdown document that structurally describes a web page's interactive surface. It is designed to be:

- **Human-readable** — renders in GitHub, VSCode, any markdown viewer
- **Machine-parseable** — strict enough for deterministic parsing
- **Token-efficient** — a full page description should be < 500 tokens

## File Structure

```markdown
---
surfaice: v1
route: /settings
states: [auth-required]
capabilities:
  - id: update-profile
    description: "User updates their display name"
    elements: [name, save]
---

# /settings

## Section Name
- [id] type "Label" (attributes) → action → result

## States
- [state-name]: description of UI changes
```

## Frontmatter (YAML)

Required fields:
- `surfaice` — format version (e.g., `v1`)
- `route` — the URL path this file describes

Optional fields:
- `states` — page-level states (e.g., `[auth-required]`)
- `capabilities` — high-level intents for agent consumption
- `baseUrl` — override base URL for this page

## Element Syntax

Each interactive element is a markdown list item:

```
- [id] type "Label" (attributes) → action → result
```

### Components

- **`[id]`** — unique identifier within the page (kebab-case)
- **`type`** — element type: `button`, `textbox`, `link`, `select`, `checkbox`, `radio`, `image`, `image-upload`, `toggle`, `slider`, `textarea`
- **`"Label"`** — visible text or accessible name (in quotes)
- **`(attributes)`** — optional modifiers: `(readonly)`, `(disabled)`, `(destructive)`, `(required)`
- **`→ action`** — what happens on interaction: API call, navigation, UI change
- **`→ result`** — outcome: `toast "message"`, `navigates: /path`, `reveals: element`, `confirms: modal`

### Examples

```markdown
- [email] textbox "Email" (required) → accepts: email
- [save] button "Save" → PUT /api/profile → toast "Saved!"
- [menu] button "Menu" → reveals:
  - [home] link "Home" → navigates: /
  - [settings] link "Settings" → navigates: /settings
- [theme] select "Theme" → options: Light, Dark, System
- [name] textbox "Display Name" → current: {user.name}
```

## Dynamic Values

Use `{expression}` for runtime/dynamic values:

```markdown
- [name] textbox "Display Name" → current: {user.name}
- [badge] badge → shows: {notification_count}
```

The sync checker verifies the element exists and contains *some* content, without matching the specific value.

## Environment Variables

Use `{{ENV_VAR}}` for secrets and test data:

```markdown
- [password] textbox "Password" → fill: {{TEST_PASSWORD}}
```

Resolved from environment at runtime.

## States Section

Describes conditional UI variations:

```markdown
## States
- [loading]: [save] disabled, shows spinner
- [empty]: [name] placeholder "Enter your name"
- [error]: inline-error below [save] "Failed to save"
- [admin]: + [ban-user] button "Ban User" (destructive)
```

- `+` prefix means the element only exists in this state
- `-` prefix means the element is hidden in this state
- `~` prefix means the element changes in this state

## Sections

Group elements by visual/logical sections using `##` headings:

```markdown
## Header
- [logo] image "MyApp" (link → /)
- [nav] links: Home, Pricing, About

## Main Content
- [title] heading "Dashboard"

## Footer
- [links] links: Privacy, Terms
```

## Reveals (Nested Content)

For elements that show hidden content on interaction:

```markdown
- [hamburger] button "Menu" → reveals:
  - [home] link "Home" → navigates: /
  - [settings] link "Settings" → navigates: /settings
  - [logout] button "Log Out" → POST /api/logout → navigates: /login
```

## Multi-Page Projects

One file per route, with an index:

```
surfaice/
├── index.surfaice.md          # App-level index
├── login.surfaice.md          # /login
├── dashboard.surfaice.md      # /dashboard
└── settings.surfaice.md       # /settings
```

### Index File

```markdown
---
surfaice: v1
name: MyApp
baseUrl: https://myapp.com
---

# MyApp — UI Map

- [/login](login.surfaice.md)
- [/dashboard](dashboard.surfaice.md) [auth-required]
- [/settings](settings.surfaice.md) [auth-required]
```

## Web Discovery

Sites publish manifests for agent consumption:

```
/.well-known/surfaice.md        → index file
/.well-known/surfaice/login.md  → per-page files
```

Or via HTML:
```html
<meta name="surfaice" href="/surfaice.md">
```
