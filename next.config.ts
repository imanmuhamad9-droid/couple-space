import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Foto sudah dikecilkan di browser (<1 MB), jadi 8 MB lebih dari cukup.
    serverActions: { bodySizeLimit: '8mb' },
    // Halaman yang baru dibuka dipakai ulang 30 detik saat pindah menu. Simpan/hapus/refresh
    // otomatis membuang cache ini, jadi data tidak basi.
    staleTimes: { dynamic: 30 },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
