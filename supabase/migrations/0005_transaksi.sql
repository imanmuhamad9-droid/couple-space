-- =====================================================================
-- Menu Uang: catatan uang masuk dan uang keluar.
-- Jalankan di Supabase SQL Editor SEBELUM memakai menu Uang. Aman dijalankan ulang.
-- RLS aktif tanpa policy: hanya server (service role) yang bisa mengakses, seperti tabel lain.
-- =====================================================================

create table if not exists public.transaksi (
  id          uuid primary key default gen_random_uuid(),
  tanggal     date not null,
  jenis       text not null check (jenis in ('masuk', 'keluar')),
  jumlah      bigint not null check (jumlah > 0),
  keterangan  text not null check (length(btrim(keterangan)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists transaksi_tanggal_idx on public.transaksi (tanggal desc);

drop trigger if exists transaksi_set_updated_at on public.transaksi;
create trigger transaksi_set_updated_at before update on public.transaksi
  for each row execute function public.set_updated_at();

alter table public.transaksi enable row level security;
