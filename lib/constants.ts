export const APP_NAME = 'Catatan Kegiatan'
export const TIMEZONE = 'Asia/Jakarta'

export const KATEGORI = [
  'Coffee shop',
  'Tempat makan',
  'Jajan',
  'Spot aesthetic',
  'Hidden gem',
  'Healing alam',
  'Nongkrong',
  'Rooftop',
  'Belanja',
  'Lainnya',
] as const

export const KOTA = [
  'Jakarta',
  'Bogor',
  'Depok',
  'Tangerang',
  'Bekasi',
  'Banten',
  'Bandung',
  'Jogja',
  'Bali',
  'Malang',
  'Surabaya',
  'Singapura',
  'Bangkok',
  'Lainnya',
] as const

export const ITEM_PER_HALAMAN = 20 // kartu per halaman di Rencana dan Histori
export const TEMPAT_PER_HALAMAN = 20
export const ME_KEY = 'catatan-kegiatan-me'

export const FOTO_BUCKET = 'foto'
export const FOTO_MAX_BYTES = 10 * 1024 * 1024
export const FOTO_URL_TTL = 60 * 60

export const KETERANGAN = {
  rencana: [
    'Tahan kartu sebentar lalu geser untuk mengubah urutan.',
    'Geser ke hari lain untuk memindahkan kegiatan ke tanggal tersebut.',
    'Jam akan menyesuaikan otomatis, jadi tidak ada yang bertabrakan.',
    'Ceklis hijau: tandai terlaksana, kegiatan pindah ke Histori. Ikon biru: upload foto.',
    'Pindah urutan dimatikan saat kamu sedang mencari.',
  ],
  histori: [
    'Kegiatan yang sudah terlaksana urut sesuai tanggal.',
    'Kegiatan di Histori tidak bisa diedit atau dihapus.',
    'Foto tetap bisa diunggah. Tekan thumbnail untuk melihat foto dalam ukuran besar.',
  ],
  database: [
    'Daftar tempat favoritmu, bisa difilter berdasarkan kategori dan kota.',
    'Tekan tombol lokasi untuk menghitung jarak tiap tempat dari posisimu.',
    'Tekan "Buka di Maps" untuk langsung membuka lokasi di Google Maps.',
    'Tekan foto untuk melihat semua fotonya dan menggeser ke samping.',
  ],
} as const
