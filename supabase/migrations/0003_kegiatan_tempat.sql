-- =====================================================================
-- Hubungkan kegiatan ke tempat di Database (opsional).
-- Dipakai untuk: rekomendasi tempat saat membuat rencana, tombol "Buka di Maps" di kartu,
-- dan menambah hitungan kunjungan otomatis saat kegiatan ditandai terlaksana.
-- Jalankan di Supabase SQL Editor SEBELUM memakai versi aplikasi ini. Aman dijalankan ulang.
-- Jika tempatnya dihapus, kegiatan tetap ada (teks lokasinya tidak hilang), hanya putus hubungannya.
-- =====================================================================

alter table public.kegiatan
  add column if not exists tempat_id uuid references public.tempat(id) on delete set null;

create index if not exists kegiatan_tempat_idx on public.kegiatan (tempat_id);
