import { describe, expect, it } from 'vitest'
import { nilai, rekapGantian, saldoGantian, sejakImpas, type Gantian } from '../lib/gantian'

let n = 0
const g = (pelaku: Gantian['pelaku'], jumlah: number, jenis: Gantian['jenis'] = 'talang', bagi = false): Gantian => ({
  id: String(++n),
  tanggal: '2026-11-26',
  jenis,
  pelaku,
  jumlah,
  bagi,
  keterangan: `K${n}`,
})
// ditulis urut waktu; fungsi menerima terbaru di atas
const baru = (...items: Gantian[]) => items.reverse()

describe('gantian', () => {
  it('saling mengurangi, lalu bayar sebagian', () => {
    const a = g('aku', 50_000)
    const b = g('dia', 20_000)
    expect(saldoGantian([b, a])).toBe(30_000)
    expect(saldoGantian([g('dia', 10_000, 'bayar'), b, a])).toBe(20_000)
  })
  it('bagi dua: sisa rupiah ditanggung yang menalangi', () => {
    expect(nilai(g('aku', 100_001, 'talang', true))).toBe(50_000)
  })
  it('aku yang berutang bernilai negatif, bayar melunasi', () => {
    expect(saldoGantian(baru(g('dia', 40_000)))).toBe(-40_000)
    expect(saldoGantian(baru(g('dia', 40_000), g('aku', 40_000, 'bayar')))).toBe(0)
  })
  it('rekap hanya memuat catatan sejak terakhir impas', () => {
    const items = baru(g('aku', 10_000), g('dia', 10_000, 'bayar'), g('aku', 25_000))
    expect(sejakImpas(items)).toHaveLength(1)
    const teks = rekapGantian(items, 'Adik')
    expect(teks).toContain('Adik harus bayar aku: *Rp 25.000*')
    expect(teks).not.toContain('Rp 10.000')
  })
})
