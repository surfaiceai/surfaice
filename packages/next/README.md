# @surfaice/next

Next.js middleware and plugin for Surfaice — serve your UI as markdown to AI agents via `Accept: text/surfaice`.

## Install

```bash
npm install @surfaice/next @surfaice/react @surfaice/format
```

## Usage

### 1. Wrap your Next.js config

```typescript
// next.config.ts
import { withSurfaice } from '@surfaice/next'

export default withSurfaice({
  enabled: process.env.SURFAICE_ENABLED === 'true',
  exclude: ['/api', '/_next'],
})(nextConfig)
```

### 2. Add middleware

```typescript
// middleware.ts
import { shouldHandleSurfaice, isRouteAllowed } from '@surfaice/next'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const accept = req.headers.get('accept') ?? ''

  if (shouldHandleSurfaice(accept) && isRouteAllowed(req.nextUrl.pathname, config)) {
    // Rewrite to Surfaice render mode
    const url = req.nextUrl.clone()
    url.searchParams.set('__surfaice', '1')
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
```

### 3. Request in Surfaice format

```bash
curl -H "Accept: text/surfaice" http://localhost:3000/settings
```

## Same URL, Different Content Type

The core principle: your `/settings` page serves HTML to browsers and markdown to agents — same URL, same auth, same data.
