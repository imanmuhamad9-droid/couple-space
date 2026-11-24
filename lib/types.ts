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
  /** Tempat di Database yang dipilih saat membuat rencana (boleh kosong). */
  tempatId: string | null
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
  /** Berapa kali dikunjungi (dihitung manual). */
  kunjungan: number
  /** ISO timestamp, untuk urutan "terbaru ditambahkan". */
  createdAt: string
  fotos: FotoItem[]
}

/** Tempat versi ringan (tanpa foto) untuk rekomendasi dan tautan peta. */
export type TempatRingkas = Pick<
  Tempat,
  'id' | 'nama' | 'kategori' | 'kota' | 'linkMaps' | 'lat' | 'lng' | 'kunjungan'
>

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string }
