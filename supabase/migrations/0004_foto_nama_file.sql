-- =====================================================================
-- Lampiran PDF: simpan nama file asli (untuk ditampilkan di kartu).
-- Tabel `foto` kini menampung foto dan PDF; jenisnya dibedakan lewat mime_type.
-- Jalankan di Supabase SQL Editor SEBELUM mengunggah PDF. Aman dijalankan ulang.
-- =====================================================================

alter table public.foto
  add column if not exists nama_file text;
