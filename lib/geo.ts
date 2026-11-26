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
  // Link tempat Google tanpa koordinat: `!1s0x<cell>:0x<id>` (web) atau `ftid=0x<cell>:0x<id>` (aplikasi HP). Bagian pertama adalah kode sel S2 yang bisa didekode.
  const ftid = s.match(/(?:!1s|[?&]ftid=)(0x[0-9a-f]+):0x[0-9a-f]+/i)
  if (ftid) return s2ToCoords(BigInt(ftid[1]))
  return null
}

const POS_TO_IJ = [
  [0, 1, 3, 2],
  [0, 2, 3, 1],
  [3, 2, 0, 1],
  [3, 1, 0, 2],
]
const POS_TO_ORIENT = [1, 0, 0, 3]

/** Titik tengah sel S2 sebagai lat/lng. Hasil perkiraan (bisa meleset ratusan meter). Null jika tidak masuk akal. */
export function s2ToCoords(id: bigint): Coords | null {
  const lsb = id & -id
  if (lsb === BigInt(0)) return null
  const face = Number(id >> BigInt(61))
  const level = 30 - Math.floor((lsb.toString(2).length - 1) / 2)
  if (face > 5 || level < 0 || level > 30) return null

  let orient = face & 1
  let i = 0
  let j = 0
  for (let l = 0; l < level; l++) {
    const pos = Number((id >> BigInt(59 - 2 * l)) & BigInt(3))
    const ij = POS_TO_IJ[orient][pos]
    i = i * 2 + (ij >> 1)
    j = j * 2 + (ij & 1)
    orient ^= POS_TO_ORIENT[pos]
  }
  const size = 2 ** (30 - level)
  const toUv = (v: number) => {
    const s = (v * size + size / 2) / 2 ** 30
    return s >= 0.5 ? (4 * s * s - 1) / 3 : (1 - 4 * (1 - s) ** 2) / 3
  }
  const u = toUv(i)
  const v = toUv(j)
  const [x, y, z] = [
    [1, u, v],
    [-u, 1, v],
    [-u, -v, 1],
    [-1, -v, -u],
    [v, -1, -u],
    [v, u, -1],
  ][face]
  const lat = (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI
  const lng = (Math.atan2(y, x) * 180) / Math.PI
  // Asia Tenggara saja; kode di luar itu (atau lat = lng) adalah hasil dekode yang rusak.
  if (lat < -12 || lat > 25 || lng < 92 || lng > 142 || Math.abs(lat - lng) < 0.01) return null
  return { lat, lng }
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
