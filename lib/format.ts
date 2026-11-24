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

/** "Rp 50.000" */
export function rupiah(n: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`
}

/** Postgres mengembalikan "HH:MM:SS"; tampilkan "HH:MM". */
export function hhmm(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}
