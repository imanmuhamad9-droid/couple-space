// Pembacaan data (server only). Bukan Server Action, jadi tidak jadi endpoint.
import { FOTO_BUCKET, FOTO_URL_TTL } from './constants'
import { hhmm } from './format'
import { admin } from './supabase-admin'
import type { FotoItem, Kegiatan, Status, Tempat, TempatRingkas } from './types'

type FotoRow = { id: string; storage_path: string; created_at: string }

/** Satu panggilan batch untuk semua signed URL (berlaku 1 jam), hanya untuk foto yang tampil. */
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

function toItems(rows: FotoRow[] | null, urls: Map<string, string>): FotoItem[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .flatMap((r) => {
      const url = urls.get(r.storage_path)
      return url ? [{ id: r.id, url }] : []
    })
}

export async function listKegiatan(status: Status): Promise<Kegiatan[]> {
  // Foto ikut dalam satu query (relasi foto.kegiatan_id), jadi tidak ada query kedua.
  const res = await admin()
    .from('kegiatan')
    .select('*, foto(id, storage_path, created_at)')
    .eq('status', status)
    .order('tanggal', { ascending: true })
    .order('jam', { ascending: true })
  if (res.error) throw new Error(res.error.message)

  const rows = res.data ?? []
  const urls = await signedUrls(rows.flatMap((r) => (r.foto ?? []) as FotoRow[]))
  return rows.map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    jam: hhmm(r.jam) ?? '00:00',
    kegiatan: r.kegiatan,
    lokasi: r.lokasi,
    budget: r.budget,
    status: r.status as Status,
    tempatId: (r.tempat_id as string | null | undefined) ?? null,
    fotos: toItems(r.foto as FotoRow[], urls),
  }))
}

export async function listTempat(): Promise<Tempat[]> {
  const res = await admin()
    .from('tempat')
    .select('*, foto(id, storage_path, created_at)')
    .order('nama', { ascending: true })
  if (res.error) throw new Error(res.error.message)

  const rows = res.data ?? []
  const urls = await signedUrls(rows.flatMap((r) => (r.foto ?? []) as FotoRow[]))
  return rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    kategori: r.kategori,
    kota: r.kota,
    buka: hhmm(r.buka),
    tutup: hhmm(r.tutup),
    linkMaps: r.link_maps,
    lat: r.lat,
    lng: r.lng,
    kunjungan: (r.kunjungan as number | undefined) ?? 0,
    createdAt: r.created_at as string,
    fotos: toItems(r.foto as FotoRow[], urls),
  }))
}

/** Daftar tempat tanpa foto: ringan, untuk rekomendasi di form rencana dan tautan Maps di kartu. */
export async function listTempatRingkas(): Promise<TempatRingkas[]> {
  const res = await admin().from('tempat').select('*').order('nama', { ascending: true })
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []).map((r) => ({
    id: r.id,
    nama: r.nama,
    kategori: r.kategori,
    kota: r.kota,
    linkMaps: r.link_maps,
    lat: r.lat,
    lng: r.lng,
    kunjungan: (r.kunjungan as number | undefined) ?? 0,
  }))
}
