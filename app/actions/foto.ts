'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { FOTO_BUCKET, FOTO_MAX_BYTES } from '@/lib/constants'
import { admin } from '@/lib/supabase-admin'

const Input = z.object({
  kind: z.enum(['kegiatan', 'tempat']),
  ownerId: z.uuid(),
})

/** Tipe file ditentukan dari isi (magic bytes), bukan dari nama atau header yang bisa dipalsukan. */
function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  const riff = String.fromCharCode(...b.slice(0, 4))
  const webp = String.fromCharCode(...b.slice(8, 12))
  if (riff === 'RIFF' && webp === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
  return null
}

export async function uploadFoto(form: FormData) {
  return run(async () => {
    const { kind, ownerId } = Input.parse({ kind: form.get('kind'), ownerId: form.get('ownerId') })
    const file = form.get('file')
    if (!(file instanceof File)) throw new Error('File tidak ditemukan')
    if (file.size === 0 || file.size > FOTO_MAX_BYTES) throw new Error('Ukuran foto maksimal 10 MB')

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = sniff(bytes)
    if (!type) throw new Error('Format foto harus JPEG, PNG, atau WebP')

    const column = kind === 'kegiatan' ? 'kegiatan_id' : 'tempat_id'
    const owner = must(await admin().from(kind).select('id').eq('id', ownerId).maybeSingle())
    if (!owner.data) throw new Error('Data tujuan tidak ditemukan')

    const path = `${kind}/${ownerId}/${randomUUID()}.${type.ext}`
    must(await admin().storage.from(FOTO_BUCKET).upload(path, bytes, { contentType: type.mime }))

    const ins = await admin().from('foto').insert({ [column]: ownerId, storage_path: path, mime_type: type.mime })
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
