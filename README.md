# Catatan Kegiatan

Aplikasi pribadi (satu pengguna, tanpa login): rencana, histori, dan database tempat. Spesifikasi lengkap ada di `CLAUDE.md` (jika disimpan di repo).

## Menjalankan

1. Isi `.env.local` (lihat `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
2. Supabase → SQL Editor: jalankan `supabase/migrations/0000_reset_lama.sql`, lalu `0001_init.sql`.
3. Supabase → Storage: hapus bucket lama `memories` dan `avatars` (Empty bucket, lalu Delete).
4. `npm install`, lalu `npm run dev`.

`npm test` menjalankan uji algoritma jadwal dan geo. `npm run build` untuk build produksi.

## Catatan keamanan

Tidak ada login. Semua tabel dan bucket memakai RLS tanpa policy, jadi hanya server (service role key) yang bisa mengakses data. Siapa pun yang tahu URL bisa memakai aplikasi, jadi jangan dibagikan.
