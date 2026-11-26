-- =====================================================================
-- Gantian: rincian per barang (siapa punya apa). `jumlah` = total di struk, jadi pajak/service/diskon
-- ikut terbagi sebanding belanja masing-masing.
-- Jalankan di Supabase SQL Editor setelah 0009. Aman dijalankan ulang.
-- =====================================================================

alter table public.gantian
  add column if not exists rincian jsonb;
