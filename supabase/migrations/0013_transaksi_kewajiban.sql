-- Pengeluaran kewajiban (cicilan, kontrakan, kasih orang tua, dll.): tidak dihitung ke jatah dompet.
alter table public.transaksi add column if not exists kewajiban boolean not null default false;
