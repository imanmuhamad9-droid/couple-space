-- =====================================================================
-- Hapus HANYA data dummy dari seed_dummy.sql (dicocokkan lewat nama/judulnya).
-- Data aslimu (hasil impor Google Maps dan rencana yang kamu buat sendiri) tidak disentuh.
--
-- Cek dulu apa yang akan terhapus (jalankan dua baris select ini lebih dulu):
--   select nama from public.tempat where nama in (...);   -- daftar sama seperti di bawah
-- Foto di Storage milik baris dummy tidak ikut terhapus; kosongkan manual di Dashboard -> Storage -> foto
-- kalau kamu pernah mengunggah foto ke data dummy.
-- =====================================================================

-- Kegiatan terlaksana dilindungi trigger, jadi dimatikan sebentar.
alter table public.kegiatan disable trigger kegiatan_guard;

delete from public.kegiatan where kegiatan in (
  'Lari pagi di GBK',
  'Sarapan bubur ayam',
  'Nonton film',
  'Ngopi sambil kerja',
  'Makan malam di rumah mertua',
  'Belanja bulanan',
  'Road trip ke Bandung lalu mampir ke beberapa tempat kopi dan oleh-oleh khas sebelum pulang malam',
  'Piknik di Taman Suropati',
  'Beli kado ulang tahun',
  'Brunch di Senopati',
  'Jalan-jalan di Kota Tua',
  'Makan sushi',
  'Sepeda santai di CFD',
  'Makan siang soto betawi'
);

alter table public.kegiatan enable trigger kegiatan_guard;

delete from public.tempat where nama in (
  'Kopi Nusantara Cipete',
  'Warung Bu Tini',
  'Jajan Pasar Senen',
  'Rooftop Langit Sudirman',
  'Taman Hutan Kota Bogor',
  'Kedai Soto Pak Haji',
  'Cafe Hidden Dago',
  'Kopi Lembang View',
  'Spot Foto Braga',
  'Angkringan Malioboro',
  'Mall Tunjungan Plaza',
  'Warung Pinggir Pantai'
);
