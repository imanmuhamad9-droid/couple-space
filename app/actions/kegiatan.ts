'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { clearOwnerFiles, removeOwnerFiles } from '@/lib/storage'
import { admin } from '@/lib/supabase-admin'

const Id = z.uuid()

const SaveInput = z.object({
  id: Id.optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  jam: z.string().regex(/^\d{2}:\d{2}$/, 'Jam tidak valid'),
  kegiatan: z.string().trim().min(1, 'Isi dulu mau ngapain').max(200, 'Kegiatan terlalu panjang'),
  lokasi: z.string().trim().max(500, 'Lokasi terlalu panjang').default(''),
  budget: z.coerce.number().int('Budget harus angka bulat').min(0).max(2_000_000_000).default(0),
  /** uuid = hubungkan ke tempat, null = putuskan, tidak dikirim = jangan diubah. */
  tempatId: Id.nullable().optional(),
})

const ChangesInput = z
  .array(
    z.object({
      id: Id,
      tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      jam: z.string().regex(/^\d{2}:\d{2}$/),
    }),
  )
  .max(200)

function refresh() {
  revalidatePath('/', 'layout')
}

async function statusOf(id: string): Promise<string> {
  const res = must(await admin().from('kegiatan').select('status').eq('id', id).maybeSingle())
  if (!res.data) throw new Error('Kegiatan tidak ditemukan')
  return res.data.status as string
}

export async function saveKegiatan(input: z.input<typeof SaveInput>) {
  return run(async () => {
    const { id, tempatId, ...fields } = SaveInput.parse(input)
    const v = tempatId === undefined ? fields : { ...fields, tempat_id: tempatId }
    if (id) {
      if ((await statusOf(id)) === 'terlaksana') throw new Error('Kegiatan yang sudah terlaksana tidak bisa diubah')
      must(await admin().from('kegiatan').update(v).eq('id', id))
    } else {
      must(await admin().from('kegiatan').insert(v))
    }
    refresh()
  })
}

export async function deleteKegiatan(idRaw: string) {
  return run(async () => {
    const id = Id.parse(idRaw)
    if ((await statusOf(id)) === 'terlaksana') throw new Error('Kegiatan yang sudah terlaksana tidak bisa dihapus')
    await removeOwnerFiles('kegiatan_id', id)
    must(await admin().from('kegiatan').delete().eq('id', id))
    refresh()
  })
}

/**
 * Tandai terlaksana. Lampiran Rencana dihapus (Histori mulai kosong).
 * Jika `tempatIdRaw` dipilih dan kegiatan belum terhubung ke tempat, kegiatan dihubungkan ke tempat itu.
 * Jumlah kunjungan tidak disimpan: dihitung dari kegiatan terlaksana yang terhubung ke tempat.
 */
export async function markTerlaksana(idRaw: string, tempatIdRaw?: string | null) {
  return run(async () => {
    const id = Id.parse(idRaw)
    const picked = tempatIdRaw ? Id.parse(tempatIdRaw) : null

    const cur = must(await admin().from('kegiatan').select('*').eq('id', id).maybeSingle())
    if (!cur.data) throw new Error('Kegiatan tidak ditemukan')
    const row = cur.data as { status: string; tempat_id?: string | null }
    if (row.status !== 'rencana') throw new Error('Kegiatan ini sudah terlaksana')

    must(
      await admin()
        .from('kegiatan')
        .update({
          status: 'terlaksana',
          terlaksana_at: new Date().toISOString(),
          ...(picked && !row.tempat_id ? { tempat_id: picked } : {}),
        })
        .eq('id', id)
        .eq('status', 'rencana'),
    )

    let lampiranGagal = false
    try {
      await clearOwnerFiles('kegiatan_id', id)
    } catch {
      lampiranGagal = true
    }
    refresh()
    if (lampiranGagal) throw new Error('Sudah terlaksana, tetapi lampiran Rencana gagal dihapus. Hapus manual dari Histori.')
  })
}

export async function reorderKegiatan(changes: z.input<typeof ChangesInput>) {
  return run(async () => {
    const parsed = ChangesInput.parse(changes)
    if (parsed.length === 0) return
    must(await admin().rpc('reorder_kegiatan', { changes: parsed }))
    refresh()
  })
}
