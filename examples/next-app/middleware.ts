import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shouldHandleSurfaice, isRouteAllowed } from '@surfaice/next'

export function middleware(req: NextRequest) {
  const accept = req.headers.get('accept') ?? ''

  if (
    shouldHandleSurfaice(accept) &&
    isRouteAllowed(req.nextUrl.pathname, {
      exclude: ['/api', '/_next', '/favicon.ico'],
    })
  ) {
    // Rewrite to the Surfaice API handler, passing the original route
    const url = req.nextUrl.clone()
    const originalPath = req.nextUrl.pathname
    url.pathname = '/api/surfaice'
    url.searchParams.set('route', originalPath)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
