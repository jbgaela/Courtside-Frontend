import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'PickleQueue — Smart queuing. Fair play.',
    template: '%s · PickleQueue',
  },
  description:
    'Automated pickleball queueing, fair skill-based matchmaking, live scoring and club management for players and Queue Masters.',
  applicationName: 'PickleQueue',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PickleQueue',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'PickleQueue — Smart queuing. Fair play.',
    description: 'The modern way to run open play.',
    type: 'website',
    siteName: 'PickleQueue',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f6ef',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Nonce-based CSP requires request-time rendering so Next can attach the
  // request nonce to framework and page scripts.
  await connection();
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
