import type { Metadata } from 'next'
import { SurfaiceProvider } from '@surfaice/react'

export const metadata: Metadata = {
  title: 'Surfaice Example',
  description: 'Example Next.js app with Surfaice UI annotations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SurfaiceProvider enabled={process.env.SURFAICE_ENABLED !== 'false'}>
          <nav style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', gap: '16px' }}>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </nav>
          <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {children}
          </main>
        </SurfaiceProvider>
      </body>
    </html>
  )
}
