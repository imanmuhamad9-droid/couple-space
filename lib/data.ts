// Pembacaan data (server only). Bukan Server Action, jadi tidak jadi endpoint.
import { FOTO_BUCKET, FOTO_URL_TTL } from './constants'
import { hhmm } from './format'
import { admin } from './supabase-admin'
import type { Dompet, FotoItem, Kegiatan, Status, Tempat, TempatRingkas, Transaksi } from './types'

type FotoRow = { id: string; storage_path: string; created_at: string; mime_type?: string; nama_file?: string | null }

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
      return url ? [{ id: r.id, url, pdf: r.mime_type === 'application/pdf', nama: r.nama_file ?? null }] : []
    })
}

/** Jumlah kunjungan per tempat = jumlah kegiatan terlaksana yang terhubung ke tempat itu. */
async function kunjunganPerTempat(): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const res = await admin().from('kegiatan').select('tempat_id').eq('status', 'terlaksana').not('tempat_id', 'is', null)
  if (res.error) return counts // kolom tempat_id belum ada (migrasi 0003 belum dijalankan)
  for (const r of res.data ?? []) {
    const id = r.tempat_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

export async function listKegiatan(status: Status): Promise<Kegiatan[]> {
  // Foto ikut dalam satu query (relasi foto.kegiatan_id), jadi tidak ada query kedua.
  const res = await admin()
    .from('kegiatan')
    .select('*, foto(*)')
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
  const [res, kunjungan] = await Promise.all([
    admin().from('tempat').select('*, foto(*)').order('nama', { ascending: true }),
    kunjunganPerTempat(),
  ])
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
    kunjungan: kunjungan.get(r.id) ?? 0,
    createdAt: r.created_at as string,
    fotos: toItems(r.foto as FotoRow[], urls),
  }))
}

/** Daftar tempat tanpa foto: ringan, untuk rekomendasi di form rencana dan tautan Maps di kartu. */
export async function listTempatRingkas(): Promise<TempatRingkas[]> {
  const [res, kunjungan] = await Promise.all([
    admin().from('tempat').select('*').order('nama', { ascending: true }),
    kunjunganPerTempat(),
  ])
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []).map((r) => ({
    id: r.id,
    nama: r.nama,
    kategori: r.kategori,
    kota: r.kota,
    linkMaps: r.link_maps,
    lat: r.lat,
    lng: r.lng,
    kunjungan: kunjungan.get(r.id) ?? 0,
  }))
}

/** Semua transaksi, terbaru di atas. Datanya kecil, jadi saldo dan periode dihitung di klien. */
export async function listTransaksi(): Promise<Transaksi[]> {
  const res = await admin()
    .from('transaksi')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []).map((r) => ({
    id: r.id,
    tanggal: r.tanggal,
    jenis: r.jenis as Transaksi['jenis'],
    jumlah: Number(r.jumlah),
    keterangan: r.keterangan,
    dompetId: r.dompet_id as string,
    tujuanId: (r.dompet_tujuan_id as string | null) ?? null,
  }))
}

export async function listDompet(): Promise<Dompet[]> {
  const res = await admin()
    .from('dompet')
    .select('id, nama, urut')
    .order('urut', { ascending: true })
    .order('created_at', { ascending: true })
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as Dompet[]
}
