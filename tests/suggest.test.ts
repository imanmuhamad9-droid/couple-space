import { describe, expect, it } from 'vitest'
import { sarankanKeterangan, suggestTempat } from '../lib/suggest'
import type { Transaksi } from '../lib/types'

const t = (nama: string, kota = 'Bandung', kategori = 'Coffee shop', kunjungan = 0) => ({ nama, kota, kategori, kunjungan })
const data = [
  t('Kopi Lembang View'),
  t('Warung Kopi Klotok', 'Jogja'),
  t('De.u Coffee Dago'),
  t('Café Kebon'),
  t('Sambal Bakar Mang Ujang', 'Bandung', 'Tempat makan', 5),
  t('Warung Nasi Ibu Oki', 'Bali', 'Tempat makan', 2),
]

describe('suggestTempat', () => {
  it('kosong jika tidak mengetik apa pun', () => expect(suggestTempat(data, '   ')).toEqual([]))
  it('nama diawali ketikan didahulukan', () => {
    expect(suggestTempat(data, 'kopi').map((x) => x.nama)).toEqual(['Kopi Lembang View', 'Warung Kopi Klotok'])
  })
  it('mengabaikan aksen dan huruf besar', () => expect(suggestTempat(data, 'CAFE')[0].nama).toBe('Café Kebon'))
  it('semua kata harus cocok, kota ikut dihitung', () => {
    expect(suggestTempat(data, 'kopi jogja').map((x) => x.nama)).toEqual(['Warung Kopi Klotok'])
  })
  it('tidak ada yang cocok: kosong, bukan tebakan', () => expect(suggestTempat(data, 'sushi')).toEqual([]))
  it('seri diurutkan dari yang paling sering dikunjungi', () => {
    expect(suggestTempat(data, 'warung').map((x) => x.nama)).toEqual(['Warung Nasi Ibu Oki', 'Warung Kopi Klotok'])
  })
  it('dibatasi jumlahnya', () => expect(suggestTempat(data, 'a', 2)).toHaveLength(2))
})

describe('sarankanKeterangan', () => {
  const tx = (keterangan: string, jumlah: number, jenis: 'masuk' | 'keluar' = 'keluar', dompetId = 'A'): Transaksi => ({
    id: keterangan + jumlah,
    tanggal: '2026-11-01',
    jenis,
    jumlah,
    keterangan,
    dompetId,
    tujuanId: null,
  })
  // terbaru di atas
  const riwayat = [
    tx('Makan siang', 35_000),
    tx('Makan malam', 50_000, 'keluar', 'B'),
    tx('makan siang', 30_000),
    tx('Gaji', 6_000_000, 'masuk'),
    tx('Bensin', 40_000),
  ]

  it('terlalu pendek: tidak ada saran', () => expect(sarankanKeterangan(riwayat, 'keluar', 'm')).toEqual([]))
  it('yang paling sering dipakai didahulukan, dengan jumlah dan dompet terakhir', () => {
    const r = sarankanKeterangan(riwayat, 'keluar', 'mak')
    expect(r.map((x) => x.keterangan)).toEqual(['Makan siang', 'Makan malam'])
    expect(r[0]).toMatchObject({ jumlah: 35_000, kali: 2, dompetId: 'A' })
    expect(r[1]).toMatchObject({ jumlah: 50_000, dompetId: 'B' })
  })
  it('hanya jenis yang sama', () => {
    expect(sarankanKeterangan(riwayat, 'keluar', 'gaj')).toEqual([])
    expect(sarankanKeterangan(riwayat, 'masuk', 'gaj')).toHaveLength(1)
  })
  it('yang sudah persis sama dengan ketikan tidak disarankan lagi', () => {
    expect(sarankanKeterangan(riwayat, 'keluar', 'Makan siang')).toEqual([])
  })
})
