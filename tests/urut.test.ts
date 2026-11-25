import { describe, expect, it } from 'vitest'
import { indeksSisip, pindahUrut } from '../lib/urut'

describe('indeksSisip', () => {
  const centers = [100, 300, 500]
  it('sebelum semua kartu', () => expect(indeksSisip(centers, 50)).toBe(0))
  it('di antara kartu', () => expect(indeksSisip(centers, 350)).toBe(2))
  it('setelah semua kartu', () => expect(indeksSisip(centers, 900)).toBe(3))
  it('tanpa kartu lain', () => expect(indeksSisip([], 10)).toBe(0))
})

describe('pindahUrut', () => {
  const ids = ['bulanan', 'tabungan', 'liburan']
  it('geser ke kanan', () => expect(pindahUrut(ids, 'bulanan', 2)).toEqual(['tabungan', 'liburan', 'bulanan']))
  it('geser ke kiri', () => expect(pindahUrut(ids, 'liburan', 0)).toEqual(['liburan', 'bulanan', 'tabungan']))
  it('posisi yang sama tidak mengubah urutan', () => expect(pindahUrut(ids, 'tabungan', 1)).toEqual(ids))
  it('posisi di luar batas dijepit', () => {
    expect(pindahUrut(ids, 'bulanan', 99)).toEqual(['tabungan', 'liburan', 'bulanan'])
    expect(pindahUrut(ids, 'liburan', -5)).toEqual(['liburan', 'bulanan', 'tabungan'])
  })
  it('tidak mengubah array asli', () => {
    pindahUrut(ids, 'bulanan', 2)
    expect(ids).toEqual(['bulanan', 'tabungan', 'liburan'])
  })
})
