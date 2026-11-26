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

export type Dompet = {
  id: string
  nama: string
  urut: number
  /** Jatah per periode gajian (Rp); null = tidak ada jatah. */
  jatah: number | null
  /** Dompet bawaan yang aturannya terkunci; null = dompet buatan sendiri. */
  jenis: 'bulanan' | 'tabungan' | 'liburan' | null
  /** Hanya liburan: lama liburan (hari). `jatah` = budget liburan. */
  hari: number | null
}

export type Transaksi = {
  id: string
  tanggal: string // YYYY-MM-DD
  /** `pindah` = pindah dana antar dompet: bukan uang masuk atau keluar. */
  jenis: 'masuk' | 'keluar' | 'pindah'
  /** Rupiah, bilangan bulat positif. Tanda (+/-) ditentukan oleh `jenis`. */
  jumlah: number
  keterangan: string
  /** Dompet tempat transaksi terjadi (untuk pindah dana: dompet asal). */
  dompetId: string
  /** Hanya untuk pindah dana: dompet tujuan. */
  tujuanId: string | null
  /** Terisi = bagian dari liburan yang sudah selesai (waktu ditutupnya). */
  liburanSelesai?: string | null
}
