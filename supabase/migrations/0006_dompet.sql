-- =====================================================================
-- Dompet: Bulanan (operasional), Tabungan, Liburan, dan seterusnya, plus "Pindah dana" antar dompet.
-- Jalankan di Supabase SQL Editor SETELAH 0005_transaksi.sql dan SEBELUM memakai versi aplikasi ini.
-- Aman dijalankan ulang. Transaksi yang sudah ada otomatis masuk ke dompet pertama (Bulanan).
-- RLS aktif tanpa policy: hanya server (service role) yang bisa mengakses.
-- =====================================================================

create table if not exists public.dompet (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (length(btrim(nama)) > 0),
  urut        integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.dompet enable row level security;

-- Dompet bawaan, hanya jika belum ada satu pun.
insert into public.dompet (nama, urut)
select v.nama, v.urut
from (values ('Bulanan', 1), ('Tabungan', 2), ('Liburan', 3)) as v(nama, urut)
where not exists (select 1 from public.dompet);

-- Dompet asal (semua transaksi) dan dompet tujuan (khusus pindah dana).
alter table public.transaksi
  add column if not exists dompet_id        uuid references public.dompet(id) on delete restrict,
  add column if not exists dompet_tujuan_id uuid references public.dompet(id) on delete restrict;

update public.transaksi
   set dompet_id = (select id from public.dompet order by urut, created_at limit 1)
 where dompet_id is null;

alter table public.transaksi alter column dompet_id set not null;

-- Jenis ketiga: pindah dana (tidak dihitung sebagai uang masuk atau keluar).
alter table public.transaksi drop constraint if exists transaksi_jenis_check;
alter table public.transaksi
  add constraint transaksi_jenis_check check (jenis in ('masuk', 'keluar', 'pindah'));

alter table public.transaksi drop constraint if exists transaksi_pindah_check;
alter table public.transaksi
  add constraint transaksi_pindah_check check (
    (jenis = 'pindah' and dompet_tujuan_id is not null and dompet_tujuan_id <> dompet_id)
    or (jenis <> 'pindah' and dompet_tujuan_id is null)
  );

create index if not exists transaksi_dompet_idx on public.transaksi (dompet_id);
create index if not exists transaksi_tujuan_idx on public.transaksi (dompet_tujuan_id);
