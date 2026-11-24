-- =====================================================================
-- DATA DUMMY untuk uji coba. Jalankan di Supabase SQL Editor SETELAH 0001_init.sql.
-- Tanggal relatif terhadap hari ini, jadi selalu tampil.
-- Foto tidak bisa diisi lewat SQL: upload sendiri lewat aplikasi (ikon biru di kartu).
-- Hapus semua dummy: jalankan seed_hapus.sql.
-- =====================================================================

-- ---------- RENCANA (5 hari -> uji pagination 3 hari/halaman) ----------
insert into public.kegiatan (tanggal, jam, kegiatan, lokasi, budget) values
  -- Hari +1: tiga kegiatan (uji geser urutan dalam hari: 07:00, 10:00, 13:00)
  (current_date + 1, '07:00', 'Lari pagi di GBK',                 'Gelora Bung Karno, Senayan',                       0),
  (current_date + 1, '10:00', 'Sarapan bubur ayam',               'https://maps.app.goo.gl/contoh-bubur',             35000),
  (current_date + 1, '13:00', 'Nonton film',                      'XXI Plaza Indonesia',                              120000),
  -- Hari +2: dua kegiatan
  (current_date + 2, '09:30', 'Ngopi sambil kerja',               'Kopi Kenangan Sudirman',                           60000),
  (current_date + 2, '19:00', 'Makan malam di rumah mertua',      '',                                                 0),
  -- Hari +4: satu kegiatan, jam sama dengan hari +1 (uji pindah antar hari tanpa bentrok)
  (current_date + 4, '10:00', 'Belanja bulanan',                  'Superindo Cipete',                                 750000),
  -- Hari +6: nama panjang (uji tampilan teks panjang)
  (current_date + 6, '08:00', 'Road trip ke Bandung lalu mampir ke beberapa tempat kopi dan oleh-oleh khas sebelum pulang malam', 'Bandung', 1500000),
  -- Hari +9: halaman 2 pagination
  (current_date + 9, '16:00', 'Piknik di Taman Suropati',         'https://www.google.com/maps/@-6.1990,106.8330,17z', 100000),
  (current_date + 9, '18:30', 'Beli kado ulang tahun',            'Grand Indonesia',                                  300000);

-- ---------- HISTORI (terlaksana, tanggal lampau) ----------
insert into public.kegiatan (tanggal, jam, kegiatan, lokasi, budget, status, terlaksana_at) values
  (current_date - 7, '10:00', 'Brunch di Senopati',          'Senopati, Jakarta Selatan', 250000, 'terlaksana', now() - interval '7 days'),
  (current_date - 7, '15:00', 'Jalan-jalan di Kota Tua',     'Kota Tua Jakarta',          50000,  'terlaksana', now() - interval '7 days'),
  (current_date - 3, '19:30', 'Makan sushi',                 'Sushi Tei Pondok Indah',    400000, 'terlaksana', now() - interval '3 days'),
  (current_date - 1, '08:00', 'Sepeda santai di CFD',        'Bundaran HI',               0,      'terlaksana', now() - interval '1 day'),
  (current_date - 1, '12:00', 'Makan siang soto betawi',     'Soto Betawi H. Husen',      80000,  'terlaksana', now() - interval '1 day');

-- ---------- TEMPAT (12 data -> uji pagination 8/halaman, chip kategori & kota) ----------
-- Koordinat sungguhan agar jarak km bisa diuji. Beberapa sengaja tanpa koordinat / jam.
insert into public.tempat (nama, kategori, kota, buka, tutup, link_maps, lat, lng) values
  ('Kopi Nusantara Cipete',   'Coffee shop',    'Jakarta',   '08:00', '22:00', 'https://www.google.com/maps/@-6.2770,106.8000,17z', -6.2770, 106.8000),
  ('Warung Bu Tini',          'Tempat makan',   'Jakarta',   '10:00', '21:00', 'https://www.google.com/maps/@-6.2297,106.8003,17z', -6.2297, 106.8003),
  ('Jajan Pasar Senen',       'Jajan',          'Jakarta',   '06:00', '18:00', '',                                                  -6.1750, 106.8450),
  ('Rooftop Langit Sudirman', 'Rooftop',        'Jakarta',   '16:00', '00:00', 'https://www.google.com/maps/@-6.2146,106.8190,17z', -6.2146, 106.8190),
  ('Taman Hutan Kota Bogor',  'Healing alam',   'Bogor',     '06:00', '18:00', 'https://www.google.com/maps/@-6.5950,106.7970,17z', -6.5950, 106.7970),
  ('Kedai Soto Pak Haji',     'Tempat makan',   'Bogor',     '07:00', '15:00', '',                                                  null,    null),
  ('Cafe Hidden Dago',        'Hidden gem',     'Bandung',   '09:00', '23:00', 'https://www.google.com/maps/@-6.8850,107.6130,17z', -6.8850, 107.6130),
  ('Kopi Lembang View',       'Coffee shop',    'Bandung',   '08:00', '21:00', 'https://www.google.com/maps/@-6.8120,107.6180,17z', -6.8120, 107.6180),
  ('Spot Foto Braga',         'Spot aesthetic', 'Bandung',   null,    null,    'https://www.google.com/maps/@-6.9175,107.6091,17z', -6.9175, 107.6091),
  ('Angkringan Malioboro',    'Nongkrong',      'Jogja',     '17:00', '02:00', 'https://www.google.com/maps/@-7.7928,110.3658,17z', -7.7928, 110.3658),
  ('Mall Tunjungan Plaza',    'Belanja',        'Surabaya',  '10:00', '22:00', 'https://www.google.com/maps/@-7.2628,112.7380,17z', -7.2628, 112.7380),
  ('Warung Pinggir Pantai',   'Lainnya',        'Bali',      '09:00', '20:00', '',                                                  null,    null);
