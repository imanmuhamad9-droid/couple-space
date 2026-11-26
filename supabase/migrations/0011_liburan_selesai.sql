-- Penanda akhir satu liburan. Transaksi dompet Liburan yang sudah ditandai tidak dihitung lagi
-- di budget liburan berikutnya, tetapi tetap tampil di riwayat.
alter table public.transaksi add column if not exists liburan_selesai timestamptz;
