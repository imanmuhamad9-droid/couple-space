import { ImageResponse } from 'next/og'

const SIZES = new Set([180, 192, 512])

// Ikon digambar saat build, jadi tidak perlu file PNG di repo.
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
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4.5" width="18" height="16" rx="3" stroke="white" strokeWidth="2" />
          <path d="M3 9.5h18M8 3v3M16 3v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="m8.5 15 2.5 2.5 4.5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  )
}
