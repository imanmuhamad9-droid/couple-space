import { formatTanggalSingkat } from './format'
import type { Transaksi } from './types'

/** Gajian setiap tanggal 25. Jika jatuh di akhir pekan, maju ke hari kerja sebelumnya (Jumat 24 atau 23). */
const HARI_GAJIAN = 25

const pad = (n: number) => String(n).padStart(2, '0')

/** Tambah/kurang hari pada tanggal ISO (YYYY-MM-DD). */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Tanggal gajian untuk bulan `m` (1-12). Hari libur nasional tidak dihitung, hanya Sabtu dan Minggu. */
export function tanggalGajian(y: number, m: number): string {
  const hari = new Date(Date.UTC(y, m - 1, HARI_GAJIAN)).getUTCDay() // 0 = Minggu, 6 = Sabtu
  const tgl = hari === 6 ? HARI_GAJIAN - 1 : hari === 0 ? HARI_GAJIAN - 2 : HARI_GAJIAN
  return `${y}-${pad(m)}-${pad(tgl)}`
}

/** Satu periode gajian: dari hari gajian sampai sehari sebelum gajian bulan berikutnya. */
export type Periode = { y: number; m: number; start: string; end: string }

function normal(y: number, m: number) {
  const t = y * 12 + (m - 1)
  return { y: Math.floor(t / 12), m: (t % 12) + 1 }
}

/** Periode yang dimulai pada gajian bulan `m` (boleh di luar 1-12, akan disesuaikan). */
export function periode(y: number, m: number): Periode {
  const a = normal(y, m)
  const b = normal(y, m + 1)
  return { ...a, start: tanggalGajian(a.y, a.m), end: addDays(tanggalGajian(b.y, b.m), -1) }
}

/** Periode yang memuat tanggal ini. Hari gajian itu sendiri sudah masuk periode baru. */
export function periodeDari(iso: string): Periode {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  return iso >= tanggalGajian(y, m) ? periode(y, m) : periode(y, m - 1)
}

export const geser = (p: Periode, delta: number): Periode => periode(p.y, p.m + delta)

/** "25 Nov – 24 Des 2026" (tahun awal ikut tampil jika periodenya melewati pergantian tahun). */
export function labelPeriode(p: Periode): string {
  const sy = p.start.slice(0, 4)
  const ey = p.end.slice(0, 4)
  return `${formatTanggalSingkat(p.start)}${sy !== ey ? ` ${sy}` : ''} – ${formatTanggalSingkat(p.end)} ${ey}`
}

/** Saldo = semua uang masuk dikurangi semua uang keluar. Masuk/keluar hanya untuk periode `p` (jika diberikan). */
export function ringkasan(items: Transaksi[], p?: Periode) {
  let saldo = 0
  let masuk = 0
  let keluar = 0
  for (const t of items) {
    saldo += t.jenis === 'masuk' ? t.jumlah : -t.jumlah
    if (p && t.tanggal >= p.start && t.tanggal <= p.end) {
      if (t.jenis === 'masuk') masuk += t.jumlah
      else keluar += t.jumlah
    }
  }
  return { saldo, masuk, keluar }
}
