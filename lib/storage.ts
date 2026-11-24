import { FOTO_BUCKET } from './constants'
import { admin } from './supabase-admin'

/** Hapus semua file foto milik satu kegiatan/tempat dari Storage (baris foto ikut terhapus lewat cascade). */
export async function removeOwnerFiles(column: 'kegiatan_id' | 'tempat_id', ownerId: string) {
  const { data, error } = await admin().from('foto').select('storage_path').eq(column, ownerId)
  if (error) throw new Error(error.message)
  const paths = (data ?? []).map((r) => r.storage_path as string)
  if (paths.length === 0) return
  const res = await admin().storage.from(FOTO_BUCKET).remove(paths)
  if (res.error) throw new Error(res.error.message)
}
