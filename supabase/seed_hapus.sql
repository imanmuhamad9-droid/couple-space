-- =====================================================================
-- HAPUS SEMUA DATA di kegiatan, tempat, dan foto (bukan hanya dummy!).
-- Kegiatan terlaksana dilindungi trigger, jadi trigger dimatikan sebentar.
-- File foto di Storage tidak ikut terhapus: kosongkan bucket "foto" lewat Dashboard -> Storage.
-- =====================================================================

alter table public.kegiatan disable trigger kegiatan_guard;
delete from public.foto;
delete from public.kegiatan;
delete from public.tempat;
alter table public.kegiatan enable trigger kegiatan_guard;
