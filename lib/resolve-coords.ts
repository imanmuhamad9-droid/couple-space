// Mencari koordinat tempat (server only). Dipakai saat menyimpan tempat.
import { parseCoords, type Coords } from './geo'

export type Resolved = {
  coords: Coords | null
  /** Dari mana koordinat didapat. */
  via: 'teks' | 'link' | 'nama' | null
  /** Alasan singkat jika gagal, supaya terlihat di layar. */
  note: string
}

const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'share.google'])
const isGoogleHost = (h: string) => /(^|\.)google\.[a-z.]+$/.test(h)

// Google kadang menjawab klien tanpa identitas browser dengan halaman lain.
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'accept-language': 'id-ID,id;q=0.9,en;q=0.8',
}

/** Ikuti link pendek Google Maps lompatan demi lompatan (maks 5, hanya host Google). */
async function fromLink(link: string): Promise<{ coords: Coords | null; note: string }> {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return { coords: null, note: 'bukan link yang valid' }
  }

  let note = 'link tidak dikenali'
  for (let hop = 0; hop < 5; hop++) {
    if (url.protocol !== 'https:') return { coords: null, note: 'link harus https' }
    if (!SHORT_HOSTS.has(url.hostname) && !isGoogleHost(url.hostname)) {
      return { coords: null, note: `host ${url.hostname} tidak didukung` }
    }

    // Link tujuan (atau halaman persetujuan cookie yang membawa link tujuan) sering sudah memuat koordinat.
    const direct = parseCoords(url.toString())
    if (direct) return { coords: direct, note: '' }

    let res: Response
    try {
      res = await fetch(url, { redirect: 'manual', headers: HEADERS, signal: AbortSignal.timeout(6000) })
    } catch {
      return { coords: null, note: `gagal membuka ${url.hostname}` }
    }
    note = `berhenti di ${url.hostname} (status ${res.status})`

    const loc = res.headers.get('location')
    if (loc) {
      url = new URL(loc, url)
      continue
    }
    // Halaman tempat (status 200): koordinat ada di dalam isi halaman.
    if (res.ok) {
      const body = (await res.text()).slice(0, 400_000)
      const fromBody = parseCoords(body)
      if (fromBody) return { coords: fromBody, note: '' }
      note = `halaman ${url.hostname} tidak memuat koordinat`
    }
    break
  }
  return { coords: null, note }
}

/** Cadangan: cari lewat nama tempat di OpenStreetMap Nominatim (gratis). Hasilnya perkiraan. */
async function fromName(nama: string, kota: string): Promise<Coords | null> {
  const q = kota && kota !== 'Lainnya' ? `${nama} ${kota}` : nama
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  const res = await fetch(url, {
    headers: { 'user-agent': 'catatan-kegiatan/1.0', 'accept-language': 'id' },
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) return null
  const [hit] = (await res.json()) as { lat: string; lon: string }[]
  if (!hit) return null
  const lat = Number(hit.lat)
  const lng = Number(hit.lon)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

export async function resolveCoords(link: string, nama: string, kota: string): Promise<Resolved> {
  let note = 'tidak ada link'

  if (link) {
    const direct = parseCoords(link)
    if (direct) return { coords: direct, via: 'teks', note: '' }
    const r = await fromLink(link)
    if (r.coords) return { coords: r.coords, via: 'link', note: '' }
    note = r.note
  }

  try {
    const byName = await fromName(nama, kota)
    if (byName) return { coords: byName, via: 'nama', note: '' }
    note += '; nama tempat juga tidak ditemukan'
  } catch {
    note += '; pencarian lewat nama gagal'
  }
  return { coords: null, via: null, note }
}
