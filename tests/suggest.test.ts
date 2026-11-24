import { describe, expect, it } from 'vitest'
import { suggestTempat } from '../lib/suggest'

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
