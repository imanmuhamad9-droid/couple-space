import { TIMEZONE } from './constants'

/** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu Jakarta. */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date())
}

function asUtc(iso: string) {
  return new Date(`${iso}T00:00:00Z`)
}

/** "Selasa, 24 November 2026" */
export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(asUtc(iso))
}

/** "24 November 2026" */
export function formatTanggalPanjang(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(asUtc(iso))
}

/** "24 Nov 2026" */
export function formatTanggalRingkas(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(asUtc(iso))
}

/** "24 Nov" */
export function formatTanggalSingkat(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(asUtc(iso))
}

/** "50.000" (pemisah ribuan, tanpa "Rp"). */
export function angka(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

/**
 * Huruf pertama jadi kapital. Sisanya tidak disentuh, jadi "KOPI" tetap "KOPI".
 * Link (http...) dibiarkan apa adanya.
 */
export function kapitalAwal(s: string): string {
  if (!s || /^\s*https?:/i.test(s)) return s
  return s.replace(/\p{L}/u, (c) => c.toUpperCase())
}

/** "Rp 50.000" */
export function rupiah(n: number): string {
  return `Rp ${angka(n)}`
}

/** Tanggal dan menit-sejak-tengah-malam (zona Jakarta) untuk waktu `ms`. */
export function nowJakarta(ms: number): { tanggal: string; menit: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  )
  return { tanggal: `${p.year}-${p.month}-${p.day}`, menit: Number(p.hour) * 60 + Number(p.minute) }
}

/** Postgres mengembalikan "HH:MM:SS"; tampilkan "HH:MM". */
export function hhmm(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}
