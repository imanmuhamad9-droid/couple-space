import { ImageResponse } from 'next/og'

const SIZES = new Set([180, 192, 512])

// Ikon peta lipat dengan pin merah, digambar saat build (tanpa file PNG di repo).
// Kotak penuh tanpa sudut membulat: iOS membulatkan sendiri.
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size)
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
        }}
      >
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
          {/* peta lipat tiga panel */}
          <path d="M2 6.5 8.5 4v14L2 20.5v-14Z" fill="#dbeafe" />
          <path d="M8.5 4 15.5 6.5v14L8.5 18V4Z" fill="#ffffff" />
          <path d="m15.5 6.5 6.5-2.5v14l-6.5 2.5v-14Z" fill="#bfdbfe" />
          {/* jalan */}
          <path d="M4 15.5 7 14.3M10 12.5l4 1.6M17.5 12l2.5-1" stroke="#93c5fd" strokeWidth="1" strokeLinecap="round" />
          {/* pin */}
          <path
            d="M12 1.5c-2.9 0-5 2.1-5 4.8 0 3.3 5 8.2 5 8.2s5-4.9 5-8.2c0-2.7-2.1-4.8-5-4.8Z"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="6.3" r="1.9" fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  )
}
