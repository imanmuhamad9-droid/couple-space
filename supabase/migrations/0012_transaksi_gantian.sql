-- Uang keluar yang berasal dari menu Gantian. Menghapus catatan gantian ikut menghapus pengeluarannya.
alter table public.transaksi add column if not exists gantian_id uuid references public.gantian (id) on delete cascade;
