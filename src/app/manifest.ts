import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PickleQueue — Smart queuing. Fair play.',
    short_name: 'PickleQueue',
    description:
      'Automated pickleball queueing, fair matchmaking, live scoring and club management.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f4f6ef',
    theme_color: '#164430',
    categories: ['sports', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'My Queue', url: '/app/queue' },
      { name: 'Live matches', url: '/app/matches' },
      { name: 'Queue Master', url: '/manage' },
    ],
  };
}
