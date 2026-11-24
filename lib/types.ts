export type Status = 'rencana' | 'terlaksana'

export type FotoItem = { id: string; url: string }

export type Kegiatan = {
  id: string
  tanggal: string // YYYY-MM-DD
  jam: string // HH:MM
  kegiatan: string
  lokasi: string
  budget: number
  status: Status
  fotos: FotoItem[]
}

export type Tempat = {
  id: string
  nama: string
  kategori: string
  kota: string
  buka: string | null // HH:MM
  tutup: string | null
  linkMaps: string
  lat: number | null
  lng: number | null
  fotos: FotoItem[]
}

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string }
