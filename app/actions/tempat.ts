'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { KATEGORI, KOTA } from '@/lib/constants'
import { kapitalAwal } from '@/lib/format'
import { resolveCoords } from '@/lib/resolve-coords'
import { removeOwnerFiles } from '@/lib/storage'
import { admin } from '@/lib/supabase-admin'

const time = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/, 'Jam tidak valid')
  .transform((v) => v || null)

const SaveInput = z.object({
  id: z.uuid().optional(),
  nama: z.string().trim().min(1, 'Isi nama tempat').max(150).transform(kapitalAwal),
  kategori: z.enum(KATEGORI, 'Pilih kategori'),
  kota: z.enum(KOTA, 'Pilih kota'),
  buka: time,
  tutup: time,
  linkMaps: z.string().trim().max(1000, 'Link terlalu panjang').default(''),
})

export async function saveTempat(input: z.input<typeof SaveInput>) {
  return run(async () => {
    const { id, linkMaps, ...v } = SaveInput.parse(input)

    // Gagal mencari koordinat tidak boleh menggagalkan simpan.
    const found = await resolveCoords(linkMaps, v.nama, v.kota).catch(() => ({
      coords: null,
      via: null,
      note: 'terjadi kesalahan saat mencari',
    }))
    const coords = found.coords
    const row = {
      ...v,
      link_maps: linkMaps,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }

    let tempatId = id
    if (id) {
      must(await admin().from('tempat').update(row).eq('id', id))
    } else {
      const res = must(await admin().from('tempat').insert(row).select('id').single())
      if (!res.data) throw new Error('Gagal menyimpan tempat')
      tempatId = res.data.id as string
    }
    revalidatePath('/', 'layout')
    return { id: tempatId as string, via: found.via, note: found.note }
  })
}

export async function deleteTempat(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    await removeOwnerFiles('tempat_id', id)
    must(await admin().from('tempat').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}
