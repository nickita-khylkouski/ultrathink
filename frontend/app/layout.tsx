import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import Script from 'next/script'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export const metadata: Metadata = {
  title: 'ULTRATHINK - Computational Drug Discovery Platform',
  description: 'Open-source computational drug discovery: ADMET screening, protein structure prediction, molecular evolution, and research paper integration',
  keywords: ['drug discovery', 'computational chemistry', 'molecular visualization', 'ESMFold', 'MolGAN', 'ADMET', 'protein structure', 'PubMed', 'DeepChem', 'research'],
  authors: [{ name: 'ULTRATHINK Research Team' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'ULTRATHINK - Computational Drug Discovery',
    description: 'Open-source platform for researchers accelerating drug discovery',
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
