# Surfaice — Example Next.js App

A minimal Next.js app demonstrating Surfaice UI annotations in action.

## What This Shows

- **`SurfaiceProvider`** — wraps the app to enable annotation collection
- **`ui.page`, `ui.section`, `ui.element`** — annotate your React components
- **`withSurfaice()`** — Next.js config plugin
- **`Accept: text/surfaice`** — request the markdown view of any page

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home/index |
| `/settings` | Settings page with profile, notifications, theme, danger zone |
| `/dashboard` | Dashboard with stats and quick actions |

## Getting Started

```bash
# From the repo root
pnpm install

# Start the dev server
cd examples/next-app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Try Surfaice

With the dev server running, request any page in Surfaice format:

```bash
# Settings page as markdown
curl -H "Accept: text/surfaice" http://localhost:3000/settings

# Dashboard as markdown
curl -H "Accept: text/surfaice" http://localhost:3000/dashboard
```

Or use the Surfaice CLI:

```bash
# Export all pages
surfaice export -u http://localhost:3000 -r /settings /dashboard -o ./surfaice/

# Check for drift (run after making UI changes)
surfaice check -u http://localhost:3000 -d ./surfaice/
```

## How It Works

1. Components are annotated with `ui.page`, `ui.section`, `ui.element`
2. `SurfaiceProvider` collects annotations at render time
3. When a request arrives with `Accept: text/surfaice`, the middleware intercepts it
4. The collected `SurfaicePage` AST is serialized to markdown
5. The markdown is returned instead of HTML

The same URL, same auth, same data — just a different content type.

## Project Structure

```
examples/next-app/
├── app/
│   ├── layout.tsx          # Root layout with SurfaiceProvider
│   ├── page.tsx            # Home page
│   ├── settings/
│   │   └── page.tsx        # Settings page (annotated)
│   └── dashboard/
│       └── page.tsx        # Dashboard page (annotated)
├── next.config.ts          # withSurfaice() plugin
├── package.json
└── README.md
```
