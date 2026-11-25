import { describe, expect, it } from 'vitest'
import { geser, labelPeriode, milikDompet, periode, periodeDari, ringkasan, tanggalGajian } from '../lib/uang'
import type { Transaksi } from '../lib/types'

describe('tanggalGajian', () => {
  it('tanggal 25 jika hari kerja', () => {
    expect(tanggalGajian(2026, 11)).toBe('2026-11-25') // Rabu
    expect(tanggalGajian(2026, 12)).toBe('2026-12-25') // Jumat
  })
  it('25 jatuh Minggu: maju ke Jumat 23', () => expect(tanggalGajian(2026, 1)).toBe('2026-01-23'))
  it('25 jatuh Sabtu: maju ke Jumat 24', () => expect(tanggalGajian(2026, 4)).toBe('2026-04-24'))
})

describe('periodeDari', () => {
  it('sehari sebelum gajian masih periode lama', () => {
    const p = periodeDari('2026-11-24')
    expect(p.start).toBe('2026-10-23') // 25 Okt 2026 Minggu, jadi gajian Jumat 23
    expect(p.end).toBe('2026-11-24')
  })
  it('hari gajian sudah periode baru', () => {
    const p = periodeDari('2026-11-25')
    expect(p.start).toBe('2026-11-25')
    expect(p.end).toBe('2026-12-24')
  })
  it('gajian yang dimajukan: hari itu mulai periode baru', () => {
    expect(periodeDari('2026-01-22').start).toBe('2025-12-25')
    expect(periodeDari('2026-01-23').start).toBe('2026-01-23')
  })
  it('periode berurutan tanpa celah dan tanpa tumpang tindih', () => {
    for (let m = 1; m <= 24; m++) {
      const a = periode(2026, m)
      const b = periode(2026, m + 1)
      const hariSetelah = new Date(`${a.end}T00:00:00Z`).getTime() + 86_400_000
      expect(new Date(`${b.start}T00:00:00Z`).getTime()).toBe(hariSetelah)
    }
  })
})

describe('geser dan label', () => {
  it('melewati pergantian tahun', () => {
    const des = periode(2026, 12)
    expect(des.end).toBe('2027-01-24')
    expect(geser(des, 1).start).toBe('2027-01-25')
    expect(geser(periode(2027, 1), -1)).toEqual(des)
  })
  it('label periode', () => {
    expect(labelPeriode(periodeDari('2026-11-25'))).toBe('25 Nov – 24 Des 2026')
    expect(labelPeriode(periode(2026, 12))).toBe('25 Des 2026 – 24 Jan 2027')
  })
})

describe('ringkasan', () => {
  const t = (tanggal: string, jenis: Transaksi['jenis'], jumlah: number, dompetId = 'A', tujuanId: string | null = null): Transaksi => ({
    id: tanggal + jenis + jumlah + dompetId,
    tanggal,
    jenis,
    jumlah,
    keterangan: 'x',
    dompetId,
    tujuanId,
  })
  const data = [
    t('2026-10-25', 'masuk', 5_000_000), // periode lama
    t('2026-11-01', 'keluar', 1_000_000),
    t('2026-11-25', 'masuk', 6_000_000), // hari gajian: periode baru
    t('2026-11-26', 'keluar', 250_000),
  ]
  it('saldo mencakup semua periode', () => expect(ringkasan(data).saldo).toBe(9_750_000))
  it('masuk dan keluar hanya untuk periode yang dipilih', () => {
    expect(ringkasan(data, periodeDari('2026-11-25'))).toEqual({ saldo: 9_750_000, masuk: 6_000_000, keluar: 250_000 })
    expect(ringkasan(data, periodeDari('2026-11-24'))).toEqual({ saldo: 9_750_000, masuk: 5_000_000, keluar: 1_000_000 })
  })
})

describe('dompet dan pindah dana', () => {
  const t = (tanggal: string, jenis: Transaksi['jenis'], jumlah: number, dompetId: string, tujuanId: string | null = null): Transaksi => ({
    id: tanggal + jenis + jumlah + dompetId,
    tanggal,
    jenis,
    jumlah,
    keterangan: 'x',
    dompetId,
    tujuanId,
  })
  const p = periodeDari('2026-11-25')
  const data = [
    t('2026-11-25', 'masuk', 5_000_000, 'bulanan'), // gaji
    t('2026-11-26', 'pindah', 1_000_000, 'bulanan', 'tabungan'),
    t('2026-11-27', 'keluar', 200_000, 'tabungan'),
    t('2026-11-28', 'pindah', 300_000, 'tabungan', 'bulanan'), // uang bulanan habis, ambil dari tabungan
  ]

  it('saldo tiap dompet mengikuti pindah dana', () => {
    expect(ringkasan(data, p, 'bulanan').saldo).toBe(4_300_000) // 5jt - 1jt + 0,3jt
    expect(ringkasan(data, p, 'tabungan').saldo).toBe(500_000) // 1jt - 0,2jt - 0,3jt
  })
  it('total semua dompet tidak berubah oleh pindah dana', () => {
    expect(ringkasan(data).saldo).toBe(4_800_000) // 5jt - 0,2jt
    expect(ringkasan(data, p, 'bulanan').saldo + ringkasan(data, p, 'tabungan').saldo).toBe(4_800_000)
  })
  it('pindah dana tidak dihitung sebagai uang masuk atau keluar', () => {
    expect(ringkasan(data, p, 'bulanan')).toMatchObject({ masuk: 5_000_000, keluar: 0 })
    expect(ringkasan(data, p, 'tabungan')).toMatchObject({ masuk: 0, keluar: 200_000 })
    expect(ringkasan(data, p)).toMatchObject({ masuk: 5_000_000, keluar: 200_000 })
  })
  it('pindah dana muncul di riwayat dompet asal dan tujuan', () => {
    const pindah = data[1]
    expect(milikDompet(pindah, 'bulanan')).toBe(true)
    expect(milikDompet(pindah, 'tabungan')).toBe(true)
    expect(milikDompet(pindah, 'liburan')).toBe(false)
    expect(milikDompet(pindah, null)).toBe(true)
  })
})
