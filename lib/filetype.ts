export type FileType = { mime: string; ext: string }

/** Tipe file ditentukan dari isi (magic bytes), bukan dari nama atau header yang bisa dipalsukan. */
export function sniffFile(b: Uint8Array): FileType | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  // "%PDF"
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { mime: 'application/pdf', ext: 'pdf' }
  const riff = String.fromCharCode(...b.slice(0, 4))
  const webp = String.fromCharCode(...b.slice(8, 12))
  if (riff === 'RIFF' && webp === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
  return null
}

/** Nama file untuk ditampilkan: tanpa karakter kontrol/pemisah path, maksimal 120 karakter. */
export function cleanFileName(raw: string, fallback = 'dokumen.pdf'): string {
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]+/g, '_')
    .trim()
    .slice(0, 120)
  return name || fallback
}
