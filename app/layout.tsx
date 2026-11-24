import type { Metadata, Viewport } from 'next'
import { FeedbackProvider } from '@/components/Feedback'
import { APP_NAME } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Catatan rencana, histori kegiatan, dan database tempat.',
  robots: { index: false, follow: false },
  icons: { icon: '/icons/192', apple: '/icons/180' },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6f7f9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  )
}
