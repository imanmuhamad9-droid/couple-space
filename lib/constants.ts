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
// Upload lewat server di Vercel dibatasi ±4,5 MB per permintaan, jadi PDF maksimal 4 MB.
export const PDF_MAX_BYTES = 4 * 1024 * 1024

export const KETERANGAN = {
  rencana: [
    'Tahan kartu sebentar lalu geser untuk mengubah urutan.',
    'Label "Terlewat" = tanggalnya sudah lewat tapi belum diceklis atau dihapus.',
    'Geser ke hari lain untuk memindahkan kegiatan ke tanggal tersebut.',
    'Jam akan menyesuaikan otomatis, jadi tidak ada yang bertabrakan.',
    'Ikon klip biru: upload foto atau PDF (PDF maks 4 MB). Tekan baris "lampiran" di kartu untuk melihat detail, foto, dan PDF-nya.',
    'Ceklis hijau: tandai terlaksana, kegiatan pindah ke Histori. Lampiran Rencana ikut dihapus, Histori mulai kosong.',
    'Saat ceklis, isi "Habis berapa?" supaya langsung tercatat di Uang keluar. Kosongkan kalau sudah dicatat.',
    'Pindah urutan dimatikan saat kamu sedang mencari.',
  ],
  histori: [
    'Kegiatan yang sudah terlaksana, terbaru di atas.',
    'Kegiatan di Histori tidak bisa diedit atau dihapus.',
    'Lampiran dari Rencana tidak ikut pindah. Foto atau PDF yang kamu unggah di sini yang tersimpan.',
    'Tekan baris "lampiran" untuk melihat detail. Tekan foto untuk memperbesar, tekan PDF untuk membukanya.',
  ],
  database: [
    'Daftar tempat favoritmu, bisa difilter berdasarkan kategori dan kota.',
    'Tekan "Jadikan rencana" untuk membuat rencana ke tempat itu; lokasinya sudah terisi.',
    'Tekan tombol lokasi untuk menghitung jarak tiap tempat dari posisimu.',
    'Tekan "Buka di Maps" untuk langsung membuka lokasi di Google Maps.',
    'Jumlah kunjungan dihitung otomatis dari kegiatan terlaksana di Histori yang tempatnya kamu pilih dari rekomendasi.',
    'Tekan foto untuk melihat semua fotonya dan menggeser ke samping.',
  ],
  uang: [
    'Geser kartu ke samping untuk berpindah dompet. Kartu "Keseluruhan" (total semua dompet) ada di ujung, disusul kartu putih "+ Dompet" untuk menambah dompet.',
    'Bulanan: jatah per periode gajian dibagi rata per hari. Kartu menampilkan batas hari ini dan sisanya; sisa hari ini tidak dibawa ke besok.',
    'Liburan: isi budget dan lama liburan (tekan kartunya). Budget dibagi per hari, dan sisa jajan hari ini dibawa ke hari berikutnya. Hari ke-1 adalah hari pertama ada pengeluaran dari dompet Liburan. Kartu berubah kuning (hampir habis) atau merah (lewat batas).',
    'Selesai liburan: tekan kartu Liburan lalu "Liburan selesai, mulai baru". Hitungan mulai dari awal, riwayat lama tetap ada dan dipisah garis. Saldo tidak berubah.',
    'Tabungan: hanya saldo, tanpa target. Tiga dompet bawaan ini terkunci (tidak bisa dihapus atau diganti nama). Dompet yang kamu tambah sendiri boleh punya jatah opsional dan bisa dihapus.',
    'Tekan lama kartu dompet lalu geser ke kiri atau kanan untuk mengubah urutannya.',
    'Saldo terus terakumulasi dan tidak di-reset saat ganti periode gajian.',
    'Pindah dana (pilih "Pindah" di form Tambah transaksi) memindahkan uang antar dompet. Total uangmu tidak berubah dan tidak dihitung sebagai uang masuk atau keluar.',
    'Uang masuk dan keluar dihitung per periode gajian: dari gajian sampai sehari sebelum gajian berikutnya. Gajian tanggal 25; jika jatuh di Sabtu atau Minggu, maju ke Jumat sebelumnya (24 atau 23). Hari libur nasional tidak dihitung.',
    'Saat mengetik keterangan transaksi baru, muncul saran dari yang pernah kamu catat. Tekan satu saran untuk mengisi keterangan, jumlah, dan dompetnya.',
    'Tekan kartu "Uang masuk" atau "Uang keluar" untuk diagram 7 hari terakhir dompet yang sedang dilihat.',
    'Kotak cari di sebelah tombol Tambah mencari keterangan, tanggal, atau jumlah di semua periode.',
    'Di semua form, bintang merah = wajib diisi.',
    'Tekan panah di atas untuk melihat periode lain. Tekan satu transaksi untuk edit atau hapus.',
  ],
  gantian: [
    'Catatan saling talangin berdua. Saldo saling mengurangi otomatis, jadi tinggal lihat siapa harus bayar berapa.',
    'Catat: pilih siapa yang bayar, lalu "Penuh" (ditalangin seluruhnya), "Bagi dua", atau "Struk".',
    'Struk: isi tiap barang dan punya siapa (Berdua = dibagi dua). Kalau ada pajak, service, atau diskon, isi "Total di struk"; selisihnya dibagi sebanding belanja masing-masing.',
    'Bayar bisa kapan saja. Nominal sudah terisi penuh; ubah angkanya kalau mau bayar sebagian, sisanya tetap tercatat.',
    '"Rekap WA" berisi saldo dan catatan sejak terakhir impas.',
    'Kamu yang nalangin atau kamu yang bayar: masuk Uang keluar. Adik yang bayar ke kamu: masuk Uang masuk. Adik yang nalangin: tidak ada yang dicatat. Edit dan hapus di sini ikut mengubah catatannya di Uang.',
    'Tekan satu catatan untuk edit atau hapus. Pembayaran hanya bisa dihapus.',
    'Tekan nama di kartu saldo untuk menggantinya.',
  ],
} as const
