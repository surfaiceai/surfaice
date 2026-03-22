import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shouldHandleSurfaice, isRouteAllowed } from '@surfaice/next'

export function middleware(req: NextRequest) {
  const accept = req.headers.get('accept') ?? ''
  const pathname = req.nextUrl.pathname

  if (
    shouldHandleSurfaice(accept) &&
    isRouteAllowed(pathname, {
      exclude: ['/api', '/_next', '/favicon.ico'],
    })
  ) {
    const routeParam = pathname.slice(1) || 'index'
    // Use redirect so the API route receives proper query params
    const apiUrl = new URL(`/api/surfaice`, req.nextUrl.origin)
    apiUrl.searchParams.set('r', routeParam)
    return NextResponse.redirect(apiUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
