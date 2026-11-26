-- =====================================================================
-- Menu Gantian: catatan saling talangin berdua (aku dan satu orang lain).
-- Berdiri sendiri: tidak mengubah transaksi maupun saldo dompet.
-- Jalankan di Supabase SQL Editor SEBELUM memakai menu Gantian. Aman dijalankan ulang.
-- RLS aktif tanpa policy: hanya server (service role) yang bisa mengakses.
-- =====================================================================

create table if not exists public.gantian (
  id          uuid primary key default gen_random_uuid(),
  tanggal     date not null,
  -- talang = menalangi, bayar = melunasi (penuh atau sebagian)
  jenis       text not null check (jenis in ('talang', 'bayar')),
  -- siapa yang mengeluarkan uang
  pelaku      text not null check (pelaku in ('aku', 'dia')),
  jumlah      bigint not null check (jumlah > 0),
  -- hanya talang: true = bagi dua, false = ditalangi penuh
  bagi        boolean not null default false,
  keterangan  text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.gantian enable row level security;

-- Nama panggilan lawan gantian (satu baris saja).
create table if not exists public.gantian_setting (
  id    integer primary key default 1 check (id = 1),
  nama  text not null default 'Adik' check (length(btrim(nama)) > 0)
);

alter table public.gantian_setting enable row level security;
