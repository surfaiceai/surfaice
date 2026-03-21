# Spec: UIManifest — Structural UI Description Standard

**v2 — Major pivot from test-script config to living UI description format**

---

## Problem

Vibe coding produces UIs fast but leaves two audiences stranded:

1. **AI agents** — they burn thousands of tokens on screenshots and DOM trees to understand a page that could be described in 200 tokens
2. **Developers** — they have no lightweight, human-readable way to document "what this UI is" that stays in sync with reality

Existing "solutions" are wrong-shaped:
- Test scripts (Playwright, Cypress) describe *procedures*, not *structure* — they break when UI changes and agents can't consume them
- API specs (Swagger/OpenAPI) describe *endpoints*, not *screens* — they say nothing about what the user sees or can do
- Visual tools (Storybook, Figma) describe *components*, not *pages and flows* — too granular, too framework-coupled

**There is no standard for describing a web UI the way a wireframe describes a design — structurally, declaratively, in a format both humans and agents can read.**

## Goal

Create `UIManifest` — an open MIT-licensed markdown-like format for describing web UI structure. A `.ui.md` file per page (or app) that says: *here's what exists, what it does, and what it connects to.*

**Success looks like:**
- Devs write (or generate) a `.ui.md` for their app — it lives in the repo, gets reviewed in PRs
- Agents read it instead of screenshotting — 10x fewer tokens, no visual parsing
- CI verifies the real UI still matches the description — drift = failure
- The format becomes a community standard others build on

## Core Concept

The manifest describes **what the UI is**, not **how to test it**.

```markdown
# /settings [auth-required]

## Profile Section
- [avatar] image-upload "Profile Photo" → PUT /api/profile/avatar
- [name] textbox "Display Name" → current: {user.name}
- [email] textbox "Email" (readonly) → shows: {user.email}
- [save] button "Save Changes" → PUT /api/profile → toast "Saved!"

## Danger Zone
- [delete] button "Delete Account" (destructive) → confirms: modal → DELETE /api/account → navigates: /
```

This single block serves three consumers:
- **Sync checker** — diffs against reality, flags drift
- **Agent reader** — understands the page in ~150 tokens, no screenshot needed
- **Human reviewer** — reads like a wireframe in a PR

## Scope

**In (v1):**
- `UIManifest` format spec — the markdown-like `.ui.md` schema (open standard, MIT)
- CLI tool: `uimanifest` with `init`, `check`, `diff` commands
  - `init <url>`: crawl a live page, generate `.ui.md` from accessibility tree + AI
  - `check`: verify real UI matches the manifest (pass/fail per element)
  - `diff`: show what changed between manifest and reality (new, missing, changed)
- GitHub Action: `uimanifest-action` — runs `check` in CI, fails PR on drift
- Discovery: `/.well-known/ui-manifest.md` and `<meta name="ui-manifest">` support
- Published format spec at `uimanifest.dev` (or GitHub Pages for v1)

**Out (v1):**
- Mobile (iOS/Android) — v2
- Agent SDK / reader library — v1.5 (format is ready; wrapper comes after adoption)
- Visual regression / screenshot diffing — separate concern
- Flow/interaction testing (step-by-step scripts) — explicitly not what this is
- Non-web surfaces — out of scope

## User Stories

- As a vibe coder, I want to run `uimanifest init https://myapp.com` so I get a human-readable description of my UI that I can commit and review
- As a developer, I want CI to fail when my UI drifts from its description, so I know when a vibe-coded change silently broke something
- As an AI agent, I want to read `/.well-known/ui-manifest.md` so I understand what's on each page without taking a screenshot
- As a team member, I want to review UI changes in a PR as a diff of the `.ui.md` file, not a wall of HTML
- As an open-source contributor, I want to build a Cypress/Puppeteer sync-checker on top of the format because it's a standard, not a tool

## Acceptance Criteria

### Format
- [ ] `.ui.md` is valid Markdown — renders readably in GitHub, VSCode, any markdown viewer
- [ ] Each file describes one route/page
- [ ] Supports: elements (with id, type, label), states (auth-required, loading, empty), actions (navigate, API call, modal, toast), dynamic values (`{user.name}`)
- [ ] Has a versioned spec (`<!-- uimanifest v1 -->` frontmatter or header)
- [ ] Token-efficient: a full page description should be < 500 tokens for typical pages
- [ ] Human-writable: a developer can write it by hand without a crawler

### CLI — `init`
- [ ] `uimanifest init <url>` crawls the URL using Playwright accessibility tree
- [ ] AI analyzes the tree and generates a `.ui.md` file
- [ ] Output is clean, human-readable, editable
- [ ] Completes in < 90 seconds for a typical page
- [ ] Handles auth-walled pages via config (`--cookie`, `--env-auth`)

### CLI — `check`
- [ ] `uimanifest check` reads all `.ui.md` files in the project
- [ ] Opens a real browser (Playwright), visits each page
- [ ] Verifies each declared element exists and matches its description
- [ ] Reports pass/fail per element with clear error messages
- [ ] Exit code 0 = all match, non-zero = drift detected

### CLI — `diff`
- [ ] `uimanifest diff` shows a structured diff: new elements (in UI, not in manifest), missing elements (in manifest, not in UI), changed elements (label/type/action changed)
- [ ] Output is human-readable and machine-parseable (--json flag)

### GitHub Action
- [ ] `uses: uimanifest/action@v1` with `url:` and optional `manifest-path:` inputs
- [ ] Runs `check` against provided URL
- [ ] Reports per-page, per-element results as PR check annotations
- [ ] Configurable: `fail-on: drift | missing-only | never`

### Discovery
- [ ] `uimanifest init` checks `/.well-known/ui-manifest.md` before crawling
- [ ] Sites can declare per-page manifests via `<meta name="ui-manifest" href="/ui.md">`
- [ ] `uimanifest fetch <url>` retrieves and displays a site's published manifest

## UI/UX Design

### CLI Experience

#### `uimanifest init`
```
$ uimanifest init https://myapp.com/settings

🔍 Crawling /settings via accessibility tree...
   Found 14 interactive elements across 3 sections

🧠 Generating UI description...

✅ Written to pages/settings.ui.md (38 lines, ~180 tokens)

Preview:
  # /settings [auth-required]
  ## Profile Section
  - [name] textbox "Display Name" → current: {user.name}
  - [save] button "Save Changes" → PUT /api/profile
  ...

Next: uimanifest check    # verify it matches reality
```

#### `uimanifest check`
```
$ uimanifest check

Checking UIManifest against https://myapp.com

  /login            ✅  8/8 elements match
  /dashboard        ✅  12/12 elements match
  /settings         ❌  DRIFT DETECTED

  /settings — 2 issues:
    ✅ [name] textbox "Display Name"
    ✅ [email] textbox "Email" (readonly)
    ❌ [save] button "Save Changes"  →  found "Save" (label changed)
    ❌ [delete] button "Delete Account"  →  NOT FOUND

3 pages — 2 passed, 1 drifted
Exit code: 1
```

#### `uimanifest diff`
```
$ uimanifest diff

/settings — 3 changes since last snapshot:
  + [theme] select "Theme"                    NEW (not in manifest)
  ~ [save] button "Save" (was "Save Changes") CHANGED
  - [delete] button "Delete Account"          MISSING
```

### The `.ui.md` format (human-readable output)
```markdown
<!-- uimanifest v1 -->
# /login

## Header
- [logo] image "MyApp" (link → /)
- [nav] links: Home, Pricing, About

## Login Form
- [email] textbox "Email" → accepts: email
- [password] textbox "Password" → accepts: string, masked
- [submit] button "Sign In" → POST /api/login → navigates: /dashboard
- [forgot] link "Forgot password?" → navigates: /forgot-password

## States
- [empty] default: form fields empty, submit enabled
- [loading] after submit: button shows spinner, fields disabled
- [error] on failure: inline error "Invalid credentials"
```

### Empty State
- `uimanifest init` on a static page with no interactive elements: generates description-only manifest noting "read-only page, no interactive elements"

### Error States
- `check` fails to reach URL: `❌ Cannot reach https://myapp.com/settings — is the app running?`
- Element present but wrong type: `❌ [save] — expected button, found div (not keyboard accessible)`
- Auth-walled page: `⚠️ /dashboard returned 401 — run with --auth-cookie or configure auth in uimanifest.config.yaml`

## Open Questions

1. **Format name** — `.ui.md` vs `ui-manifest.md` vs `UISPEC.md`? Needs to be obvious and not conflict with existing conventions.
2. **Multi-page projects** — one file per page (`pages/login.ui.md`) or one file for the whole app with `# /route` sections?
3. **Dynamic values** — `{user.name}` syntax for runtime values — do we specify a full template syntax or keep it freeform?
4. **Auth config** — how does `init`/`check` handle pages behind login? Config file? CLI flags? Both?
5. **Project name** — still working with `UIManifest`. Haosu to confirm.
