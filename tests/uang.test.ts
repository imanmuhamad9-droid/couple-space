import { describe, expect, it } from 'vitest'
import { bulananHarian, geser, jatahInfo, liburanInfo, totalHarian, labelPeriode, milikDompet, periode, periodeDari, ringkasan, tanggalGajian } from '../lib/uang'
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

describe('jatahInfo', () => {
  const t = (tanggal: string, jenis: Transaksi['jenis'], jumlah: number, tujuanId: string | null = null): Transaksi => ({
    id: tanggal + jenis + jumlah,
    tanggal,
    jenis,
    jumlah,
    keterangan: 'x',
    dompetId: 'bulanan',
    tujuanId,
  })
  const p = periodeDari('2026-11-25') // 25 Nov - 24 Des 2026 (30 hari)
  const data = [
    t('2026-11-25', 'masuk', 5_000_000),
    t('2026-11-26', 'keluar', 800_000),
    t('2026-11-27', 'keluar', 400_000),
    t('2026-11-28', 'pindah', 1_000_000, 'tabungan'), // bukan pengeluaran
  ]

  it('terpakai hanya uang keluar, tanpa pindah dana', () => {
    const r = jatahInfo(data, p, 'bulanan', 3_000_000, '2026-11-28')
    expect(r.terpakai).toBe(1_200_000)
    expect(r.sisa).toBe(1_800_000)
    expect(r.persen).toBe(40)
    expect(r.lewat).toBe(false)
  })
  it('batas harian: sisa dibagi sisa hari termasuk hari ini', () => {
    // 28 Nov sampai 24 Des = 27 hari; 1.800.000 / 27 = 66.666 -> 66.666
    const r = jatahInfo(data, p, 'bulanan', 3_000_000, '2026-11-28')
    expect(r.sisaHari).toBe(27)
    expect(r.perHari).toBe(66_666)
  })
  it('hari terakhir periode: sisa hari = 1', () => {
    expect(jatahInfo(data, p, 'bulanan', 3_000_000, '2026-12-24').sisaHari).toBe(1)
  })
  it('periode yang sudah lewat tidak punya batas harian', () => {
    const lama = periodeDari('2026-10-24')
    expect(jatahInfo(data, lama, 'bulanan', 3_000_000, '2026-11-28').perHari).toBeNull()
  })
  it('jatah terlewati: tandai lewat, bar penuh, tanpa batas harian', () => {
    const r = jatahInfo(data, p, 'bulanan', 1_000_000, '2026-11-28')
    expect(r.lewat).toBe(true)
    expect(r.sisa).toBe(-200_000)
    expect(r.persen).toBe(100)
    expect(r.perHari).toBeNull()
  })
})

describe('bulananHarian & liburanInfo', () => {
  const t = (tanggal: string, jumlah: number, dompetId = 'b'): Transaksi => ({
    id: tanggal + jumlah + dompetId, tanggal, jenis: 'keluar', jumlah, keterangan: 'x', dompetId, tujuanId: null,
  })
  const p = periodeDari('2026-11-25') // 30 hari

  it('bulanan: batas = jatah / hari periode, hanya pengeluaran hari ini, tanpa carry', () => {
    const data = [t('2026-11-26', 90_000), t('2026-11-27', 30_000)]
    const r = bulananHarian(data, p, 'b', 3_000_000, '2026-11-27')
    expect(r.batas).toBe(100_000)
    expect(r.terpakai).toBe(30_000)
    expect(r.sisa).toBe(70_000) // 10rb sisa kemarin tidak ikut
    expect(r.status).toBe('aman')
  })
  it('bulanan: status dekat dan lewat', () => {
    expect(bulananHarian([t('2026-11-27', 85_000)], p, 'b', 3_000_000, '2026-11-27').status).toBe('dekat')
    expect(bulananHarian([t('2026-11-27', 120_000)], p, 'b', 3_000_000, '2026-11-27').status).toBe('lewat')
  })
  it('liburan: sisa jajan dibawa ke hari berikutnya', () => {
    // 1 jt untuk 2 hari: 500rb/hari. Hari 1 pakai 300rb -> hari 2 boleh 700rb.
    const data = [t('2026-12-01', 300_000, 'l')]
    expect(liburanInfo(data, 'l', 1_000_000, 2, '2026-12-01').bolehHariIni).toBe(200_000)
    const h2 = liburanInfo(data, 'l', 1_000_000, 2, '2026-12-02')
    expect(h2.hariKe).toBe(2)
    expect(h2.bolehHariIni).toBe(700_000)
    expect(h2.sisaTotal).toBe(700_000)
  })
  it('liburan: belum ada pengeluaran = hari ke-1; lewat hari tetap dibatasi budget', () => {
    expect(liburanInfo([], 'l', 1_000_000, 2, '2026-12-05')).toMatchObject({ hariKe: 1, bolehHariIni: 500_000, status: 'aman' })
    const r = liburanInfo([t('2026-12-01', 900_000, 'l')], 'l', 1_000_000, 2, '2026-12-09')
    expect(r.hariKe).toBe(2)
    expect(r.bolehHariIni).toBe(100_000)
  })
  it('liburan: yang sudah ditutup tidak dihitung', () => {
    const lama = { ...t('2026-11-01', 900_000, 'l'), liburanSelesai: '2026-11-03T00:00:00Z' }
    const r = liburanInfo([t('2026-12-01', 100_000, 'l'), lama], 'l', 1_000_000, 2, '2026-12-01')
    expect(r).toMatchObject({ terpakai: 100_000, hariKe: 1, status: 'aman' })
  })
  it('liburan: lewat batas hari ini, dan hanya hitung dompet itu', () => {
    const data = [t('2026-12-01', 600_000, 'l'), t('2026-12-01', 999_999, 'lain')]
    const r = liburanInfo(data, 'l', 1_000_000, 2, '2026-12-01')
    expect(r.terpakai).toBe(600_000)
    expect(r.status).toBe('lewat')
  })
})

describe('totalHarian', () => {
  const t = (tanggal: string, jenis: Transaksi['jenis'], jumlah: number, dompetId = 'a'): Transaksi => ({
    id: tanggal + jenis + jumlah, tanggal, jenis, jumlah, keterangan: 'x', dompetId, tujuanId: null,
  })
  const data = [
    t('2026-11-26', 'keluar', 10_000),
    t('2026-11-26', 'keluar', 5_000, 'b'),
    t('2026-11-20', 'keluar', 7_000),
    t('2026-11-19', 'keluar', 99_000), // di luar 7 hari
    t('2026-11-26', 'pindah', 50_000),
  ]
  it('7 hari sampai hari ini, terlama dulu, tanpa pindah dana', () => {
    const r = totalHarian(data, 'keluar', null, '2026-11-26')
    expect(r).toHaveLength(7)
    expect(r[0]).toEqual({ tanggal: '2026-11-20', jumlah: 7_000 })
    expect(r[6]).toEqual({ tanggal: '2026-11-26', jumlah: 15_000 })
  })
  it('per dompet', () => expect(totalHarian(data, 'keluar', 'b', '2026-11-26')[6].jumlah).toBe(5_000))
})
