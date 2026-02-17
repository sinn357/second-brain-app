declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  type PWAOptions = {
    dest?: string
    sw?: string
    scope?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
  }

  export default function withPWA(options?: PWAOptions): (nextConfig: NextConfig) => NextConfig
}
