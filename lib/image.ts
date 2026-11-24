const MAX_SIDE = 1280
const QUALITY = 0.82

/** Kecilkan foto di browser: sisi terpanjang maks 1280 px, JPEG kualitas 0.82. */
export async function resizeImage(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.fillStyle = '#fff' // PNG transparan jadi putih, bukan hitam
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()

    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', QUALITY))
    if (!blob) throw new Error('blob')
    const name = file.name.replace(/\.[^.]+$/, '') || 'foto'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file // browser tidak bisa mendekode; server tetap memvalidasi tipe dan ukuran
  }
}
