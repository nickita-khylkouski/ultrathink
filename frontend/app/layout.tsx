import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import Script from 'next/script'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export const metadata: Metadata = {
  title: 'AI Drug Discovery Platform',
  description: 'Accelerate drug discovery with AI: Traditional screening, protein structure prediction, and molecular evolution',
  keywords: ['drug discovery', 'AI', 'molecular visualization', 'ESMFold', 'MolGAN', 'ADMET', 'protein structure'],
  authors: [{ name: 'AI Drug Discovery Team' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'AI Drug Discovery Platform',
    description: 'Accelerate drug discovery with AI-powered tools',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Load 3Dmol.js from CDN */}
        <Script
          src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="font-mono bg-background text-primary">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
