-- =====================================================================
-- Jatah per periode gajian untuk sebuah dompet (opsional), misalnya dompet Bulanan.
-- Dipakai untuk menampilkan "terpakai / sisa / boleh dipakai per hari" di kartu dompet.
-- Jalankan di Supabase SQL Editor SEBELUM mengisi jatah. Aman dijalankan ulang.
-- Kosong (null) = dompet itu tidak punya jatah.
-- =====================================================================

alter table public.dompet
  add column if not exists jatah bigint check (jatah is null or jatah > 0);
