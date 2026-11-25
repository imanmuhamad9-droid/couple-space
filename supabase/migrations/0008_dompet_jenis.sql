-- =====================================================================
-- Dompet bawaan punya aturan sendiri:
--   bulanan  : jatah per periode dibagi per hari (sisa hari ini tidak dibawa ke besok)
--   tabungan : tanpa target
--   liburan  : budget + jumlah hari (sisa hari ini dibawa ke hari berikutnya)
-- `jenis` mengunci dompet bawaan (tidak bisa dihapus/ganti nama). Dompet buatan sendiri: jenis kosong.
-- Jalankan di Supabase SQL Editor setelah 0007. Aman dijalankan ulang.
-- =====================================================================

alter table public.dompet
  add column if not exists jenis text check (jenis in ('bulanan', 'tabungan', 'liburan')),
  add column if not exists hari  integer check (hari is null or hari > 0);

update public.dompet set jenis = 'bulanan'  where jenis is null and lower(btrim(nama)) = 'bulanan'  and not exists (select 1 from public.dompet where jenis = 'bulanan');
update public.dompet set jenis = 'tabungan' where jenis is null and lower(btrim(nama)) = 'tabungan' and not exists (select 1 from public.dompet where jenis = 'tabungan');
update public.dompet set jenis = 'liburan'  where jenis is null and lower(btrim(nama)) = 'liburan'  and not exists (select 1 from public.dompet where jenis = 'liburan');

-- Tabungan tidak punya target.
update public.dompet set jatah = null, hari = null where jenis = 'tabungan';
