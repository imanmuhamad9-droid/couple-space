export type Status = 'rencana' | 'terlaksana'

/** Lampiran: foto atau PDF (tabel `foto` menampung keduanya). */
export type FotoItem = { id: string; url: string; pdf: boolean; nama: string | null }

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

export type Transaksi = {
  id: string
  tanggal: string // YYYY-MM-DD
  jenis: 'masuk' | 'keluar'
  /** Rupiah, bilangan bulat positif. Tanda (+/-) ditentukan oleh `jenis`. */
  jumlah: number
  keterangan: string
}
