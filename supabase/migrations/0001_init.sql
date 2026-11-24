-- =====================================================================
-- Catatan Kegiatan - skema (Supabase / Postgres). Tanpa login, satu pengguna.
-- Jalankan lewat Supabase SQL Editor (setelah 0000_reset_lama.sql).
-- Semua tabel RLS aktif TANPA policy: anon key tidak bisa membaca/menulis apa pun.
-- Aplikasi mengakses data lewat server dengan service role key.
-- =====================================================================

-- ---------- TABEL KEGIATAN (rencana + histori) ----------
create table if not exists public.kegiatan (
  id            uuid primary key default gen_random_uuid(),
  tanggal       date not null,
  jam           time not null,
  kegiatan      text not null check (length(btrim(kegiatan)) > 0),
  lokasi        text not null default '',
  budget        integer not null default 0 check (budget >= 0),
  status        text not null default 'rencana' check (status in ('rencana', 'terlaksana')),
  terlaksana_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists kegiatan_tanggal_idx on public.kegiatan (tanggal, jam);
create index if not exists kegiatan_status_idx  on public.kegiatan (status);

-- ---------- TABEL TEMPAT (database) ----------
create table if not exists public.tempat (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (length(btrim(nama)) > 0),
  kategori    text not null,
  kota        text not null,
  buka        time,
  tutup       time,
  link_maps   text not null default '',
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tempat_kota_idx on public.tempat (kota);

-- ---------- TABEL FOTO (metadata; file asli di Supabase Storage) ----------
create table if not exists public.foto (
  id           uuid primary key default gen_random_uuid(),
  kegiatan_id  uuid references public.kegiatan(id) on delete cascade,
  tempat_id    uuid references public.tempat(id) on delete cascade,
  storage_path text not null unique,
  mime_type    text not null default 'image/jpeg',
  created_at   timestamptz not null default now(),
  check (num_nonnulls(kegiatan_id, tempat_id) = 1)
);

create index if not exists foto_kegiatan_idx on public.foto (kegiatan_id);
create index if not exists foto_tempat_idx   on public.foto (tempat_id);

-- ---------- TRIGGER updated_at ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists kegiatan_set_updated_at on public.kegiatan;
create trigger kegiatan_set_updated_at before update on public.kegiatan
  for each row execute function public.set_updated_at();

drop trigger if exists tempat_set_updated_at on public.tempat;
create trigger tempat_set_updated_at before update on public.tempat
  for each row execute function public.set_updated_at();

-- ---------- TRIGGER: kegiatan terlaksana tidak bisa diubah/dihapus ----------
-- Foto tetap boleh ditambah (lewat tabel foto), jadi aturan ini hanya di tabel kegiatan.
create or replace function public.guard_terlaksana() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'terlaksana' then
      raise exception 'Kegiatan yang sudah terlaksana tidak bisa dihapus';
    end if;
    return old;
  end if;

  if old.status = 'terlaksana' and (
       new.status <> 'terlaksana'
    or new.tanggal <> old.tanggal
    or new.jam <> old.jam
    or new.kegiatan <> old.kegiatan
    or new.lokasi <> old.lokasi
    or new.budget <> old.budget
  ) then
    raise exception 'Kegiatan yang sudah terlaksana tidak bisa diubah';
  end if;
  return new;
end $$;

drop trigger if exists kegiatan_guard on public.kegiatan;
create trigger kegiatan_guard before update or delete on public.kegiatan
  for each row execute function public.guard_terlaksana();

-- ---------- RLS: aktif, tanpa policy (hanya service role yang bisa akses) ----------
alter table public.kegiatan enable row level security;
alter table public.tempat   enable row level security;
alter table public.foto     enable row level security;

-- ---------- FUNGSI: pindah urutan / pindah hari (satu transaksi) ----------
-- changes = [{"id": "...", "tanggal": "2026-11-24", "jam": "10:00"}, ...]
-- Hasil perhitungan jam ada di aplikasi (lib/schedule.ts). Fungsi ini hanya menyimpan.
create or replace function public.reorder_kegiatan(changes jsonb) returns void
language plpgsql as $$
begin
  update public.kegiatan k
     set tanggal = (c->>'tanggal')::date,
         jam     = (c->>'jam')::time
    from jsonb_array_elements(changes) c
   where k.id = (c->>'id')::uuid
     and k.status = 'rencana';
end $$;

-- Fungsi hanya boleh dipanggil dari server (service role), bukan dari anon key.
revoke all on function public.reorder_kegiatan(jsonb) from public, anon, authenticated;
grant execute on function public.reorder_kegiatan(jsonb) to service_role;

-- ---------- STORAGE: bucket foto (privat, tanpa policy) ----------
-- Path file: kegiatan/{kegiatan_id}/{uuid}.jpg  atau  tempat/{tempat_id}/{uuid}.jpg
insert into storage.buckets (id, name, public)
values ('foto', 'foto', false)
on conflict (id) do nothing;
