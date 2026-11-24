-- =====================================================================
-- Hitungan kunjungan per tempat (untuk urutan "Paling sering dikunjungi").
-- Jalankan di Supabase SQL Editor SEBELUM memakai versi aplikasi ini. Aman dijalankan ulang.
-- =====================================================================

alter table public.tempat
  add column if not exists kunjungan integer not null default 0 check (kunjungan >= 0);
