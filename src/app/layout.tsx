import type { Metadata, Viewport } from 'next'
import { Providers } from '@/app/providers'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Based DOOM',
  description: 'Based DOOM is a browser-based survival shooter built on Next.js, Phaser, and Base.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
