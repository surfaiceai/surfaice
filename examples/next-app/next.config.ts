import type { NextConfig } from 'next'
import { withSurfaice } from '@surfaice/next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withSurfaice({
  enabled: process.env.SURFAICE_ENABLED !== 'false',
})(nextConfig)
