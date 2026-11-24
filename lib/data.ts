// Pembacaan data (server only). Bukan Server Action, jadi tidak jadi endpoint.
import { FOTO_BUCKET, FOTO_URL_TTL } from './constants'
import { hhmm } from './format'
import { admin } from './supabase-admin'
import type { FotoItem, Kegiatan, Status, Tempat } from './types'

type FotoRow = { id: string; kegiatan_id: string | null; tempat_id: string | null; storage_path: string }

/** Satu panggilan batch untuk semua signed URL (berlaku 1 jam). */
async function signedUrls(rows: FotoRow[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (rows.length === 0) return urls
  const { data, error } = await admin()
    .storage.from(FOTO_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      FOTO_URL_TTL,
    )
  if (error) throw new Error(error.message)
  for (const d of data ?? []) if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl)
  return urls
}

async function fotosByOwner(column: 'kegiatan_id' | 'tempat_id'): Promise<Map<string, FotoItem[]>> {
  const { data, error } = await admin()
    .from('foto')
    .select('id, kegiatan_id, tempat_id, storage_path')
    .not(column, 'is', null)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as FotoRow[]
  const urls = await signedUrls(rows)
  const map = new Map<string, FotoItem[]>()
  for (const r of rows) {
    const url = urls.get(r.storage_path)
    const owner = r[column]
    if (!url || !owner) continue
    map.set(owner, [...(map.get(owner) ?? []), { id: r.id, url }])
  }
  return map
}

export async function listKegiatan(status: Status): Promise<Kegiatan[]> {
  const [res, fotos] = await Promise.all([
    admin()
      .from('kegiatan')
      .select('id, tanggal, jam, kegiatan, lokasi, budget, status')
      .eq('status', status)
      .order('tanggal', { ascending: true })
      .order('jam', { ascending: true }),
    fotosByOwner('kegiatan_id'),
  ])
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []).map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    jam: hhmm(r.jam) ?? '00:00',
    kegiatan: r.kegiatan,
    lokasi: r.lokasi,
    budget: r.budget,
    status: r.status as Status,
    fotos: fotos.get(r.id) ?? [],
  }))
}

export async function listTempat(): Promise<Tempat[]> {
  const [res, fotos] = await Promise.all([
    admin()
      .from('tempat')
      .select('id, nama, kategori, kota, buka, tutup, link_maps, lat, lng')
      .order('nama', { ascending: true }),
    fotosByOwner('tempat_id'),
  ])
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []).map((r) => ({
    id: r.id,
    nama: r.nama,
    kategori: r.kategori,
    kota: r.kota,
    buka: hhmm(r.buka),
    tutup: hhmm(r.tutup),
    linkMaps: r.link_maps,
    lat: r.lat,
    lng: r.lng,
    fotos: fotos.get(r.id) ?? [],
  }))
}
