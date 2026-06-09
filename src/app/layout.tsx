import type { Metadata, Viewport } from 'next'
import { Providers } from '@/app/providers'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Based DooM',
  description: 'Based DooM is a browser-based survival shooter built on Next.js, Phaser, and Base.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="69e39c8642302cc6a1381d44" />

        <meta
          name="talentapp:project_verification"
          content="27ed491a86187c7439278732681f825a0161531ba2b8caff4a39f2ac753be666353687f8df47f38e2b3bb4970b4d5d3be790e4d8eeb74058afbf71548c754623"
        />
      </head>

      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
