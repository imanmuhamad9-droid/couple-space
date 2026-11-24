'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { FOTO_BUCKET, FOTO_MAX_BYTES, PDF_MAX_BYTES } from '@/lib/constants'
import { cleanFileName, sniffFile } from '@/lib/filetype'
import { admin } from '@/lib/supabase-admin'

const Input = z.object({
  kind: z.enum(['kegiatan', 'tempat']),
  ownerId: z.uuid(),
})

export async function uploadFoto(form: FormData) {
  return run(async () => {
    const { kind, ownerId } = Input.parse({ kind: form.get('kind'), ownerId: form.get('ownerId') })
    const file = form.get('file')
    if (!(file instanceof File)) throw new Error('File tidak ditemukan')
    if (file.size === 0 || file.size > FOTO_MAX_BYTES) throw new Error('Ukuran file maksimal 10 MB')

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = sniffFile(bytes)
    if (!type) throw new Error('Format file harus JPEG, PNG, WebP, atau PDF')

    const isPdf = type.mime === 'application/pdf'
    if (isPdf && kind !== 'kegiatan') throw new Error('PDF hanya bisa dilampirkan ke kegiatan')
    if (isPdf && file.size > PDF_MAX_BYTES) throw new Error('PDF maksimal 4 MB')
    const nama = isPdf ? cleanFileName(String(form.get('nama') ?? file.name)) : null

    const column = kind === 'kegiatan' ? 'kegiatan_id' : 'tempat_id'
    const owner = must(await admin().from(kind).select('id').eq('id', ownerId).maybeSingle())
    if (!owner.data) throw new Error('Data tujuan tidak ditemukan')

    const path = `${kind}/${ownerId}/${randomUUID()}.${type.ext}`
    must(await admin().storage.from(FOTO_BUCKET).upload(path, bytes, { contentType: type.mime }))

    const ins = await admin()
      .from('foto')
      .insert({ [column]: ownerId, storage_path: path, mime_type: type.mime, ...(nama ? { nama_file: nama } : {}) })
    if (ins.error) {
      await admin().storage.from(FOTO_BUCKET).remove([path])
      throw new Error(ins.error.message)
    }
    revalidatePath('/', 'layout')
  })
}

export async function deleteFoto(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    const row = must(await admin().from('foto').select('storage_path').eq('id', id).maybeSingle())
    if (!row.data) return
    must(await admin().storage.from(FOTO_BUCKET).remove([row.data.storage_path as string]))
    must(await admin().from('foto').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}
