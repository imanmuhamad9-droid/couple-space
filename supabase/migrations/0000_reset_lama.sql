-- =====================================================================
-- Reset: hapus tabel aplikasi lama (couple-space). JALANKAN SEKALI, SEBELUM 0001_init.sql.
-- Menghapus SEMUA data lama secara permanen.
-- Bucket lama (memories, avatars) tidak bisa dihapus lewat SQL:
--   Supabase Dashboard -> Storage -> pilih bucket -> Empty bucket -> Delete bucket.
-- =====================================================================

drop table if exists public.memories cascade;
drop table if exists public.meetings cascade;
drop table if exists public.settings cascade;
