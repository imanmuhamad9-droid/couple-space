import { describe, expect, it } from 'vitest'
import { cleanFileName, sniffFile } from '../lib/filetype'

const bytes = (...n: number[]) => new Uint8Array([...n, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

describe('sniffFile', () => {
  it('mengenali JPEG, PNG, dan PDF dari isinya', () => {
    expect(sniffFile(bytes(0xff, 0xd8, 0xff))?.mime).toBe('image/jpeg')
    expect(sniffFile(bytes(0x89, 0x50, 0x4e, 0x47))?.mime).toBe('image/png')
    expect(sniffFile(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toEqual({ mime: 'application/pdf', ext: 'pdf' })
  })
  it('mengenali WebP', () => {
    const b = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
    expect(sniffFile(b)?.mime).toBe('image/webp')
  })
  it('menolak file lain, misalnya skrip yang diberi nama .pdf', () => {
    expect(sniffFile(new TextEncoder().encode('<script>alert(1)</script>'))).toBeNull()
    expect(sniffFile(new Uint8Array([]))).toBeNull()
  })
})

describe('cleanFileName', () => {
  it('membuang pemisah path dan karakter kontrol', () => {
    expect(cleanFileName('../../etc/passwd\u0000.pdf')).toBe('.._.._etc_passwd.pdf')
  })
  it('memotong nama yang terlalu panjang dan memberi cadangan jika kosong', () => {
    expect(cleanFileName('a'.repeat(300))).toHaveLength(120)
    expect(cleanFileName('   ')).toBe('dokumen.pdf')
  })
})
