import 'react-datepicker/dist/react-datepicker.css'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, Merriweather } from 'next/font/google'

// Font untuk teks biasa (rapi)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
// Font untuk judul (slab serif)
const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'], 
  subsets: ['latin'], 
  variable: '--font-merriweather' 
})

export const metadata: Metadata = {
  title: 'Our Space',
  description: 'Ruang privat buat kita berdua.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Our Space',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Default-nya pakai Inter (rapi) */}
      <body className={`${inter.variable} ${merriweather.variable} font-sans`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}