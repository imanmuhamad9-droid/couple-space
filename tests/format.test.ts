import { describe, expect, it } from 'vitest'
import { angka, kapitalAwal } from '../lib/format'

describe('kapitalAwal', () => {
  it('huruf pertama jadi kapital, sisanya tetap', () => {
    expect(kapitalAwal('ngopi di bandung')).toBe('Ngopi di bandung')
    expect(kapitalAwal('iPhone baru')).toBe('IPhone baru')
  })
  it('yang sudah kapital semua tidak diubah', () => expect(kapitalAwal('KOPI HITAM')).toBe('KOPI HITAM'))
  it('lewati spasi/angka di depan, dan link dibiarkan', () => {
    expect(kapitalAwal('  makan')).toBe('  Makan')
    expect(kapitalAwal('7 eleven')).toBe('7 Eleven')
    expect(kapitalAwal('https://maps.app.goo.gl/x')).toBe('https://maps.app.goo.gl/x')
    expect(kapitalAwal('')).toBe('')
  })
})
describe('angka', () => it('pemisah ribuan titik', () => expect(angka(2500000)).toBe('2.500.000')))
