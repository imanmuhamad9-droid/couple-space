import type { Tempat } from './types'

export type Coords = { lat: number; lng: number }

const NUM = '(-?\\d+(?:\\.\\d+)?)'

function valid(lat: number, lng: number): Coords | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

/**
 * Ambil koordinat dari teks: "lat, lng" polos, atau link Google Maps
 * (`@lat,lng`, `!3dLAT!4dLNG`, `?q=lat,lng`). Link pendek tidak bisa dibaca di sini.
 */
export function parseCoords(text: string): Coords | null {
  const s = safe(text).trim()
  if (!s) return null

  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`),
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(`[?&](?:q|ll|query|destination)=${NUM}[, ]\\s*${NUM}`),
    new RegExp(`^\\s*${NUM}\\s*[, ]\\s*${NUM}\\s*$`),
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) {
      const c = valid(Number(m[1]), Number(m[2]))
      if (c) return c
    }
  }
  return null
}

function safe(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Jarak garis lurus dalam km (haversine). */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function isHttpLink(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

/** Link "Buka di Maps": link tersimpan jika ada, jika tidak koordinat atau nama + kota. */
export function mapsUrl(t: Pick<Tempat, 'linkMaps' | 'lat' | 'lng' | 'nama' | 'kota'>): string {
  if (isHttpLink(t.linkMaps)) return t.linkMaps.trim()
  const query = t.lat !== null && t.lng !== null ? `${t.lat},${t.lng}` : `${t.nama} ${t.kota}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
