'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { KATEGORI, KOTA } from '@/lib/constants'
import { parseCoords, type Coords } from '@/lib/geo'
import { removeOwnerFiles } from '@/lib/storage'
import { admin } from '@/lib/supabase-admin'

const time = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/, 'Jam tidak valid')
  .transform((v) => v || null)

const SaveInput = z.object({
  id: z.uuid().optional(),
  nama: z.string().trim().min(1, 'Isi nama tempat').max(150),
  kategori: z.enum(KATEGORI, 'Pilih kategori'),
  kota: z.enum(KOTA, 'Pilih kota'),
  buka: time,
  tutup: time,
  linkMaps: z.string().trim().max(1000, 'Link terlalu panjang').default(''),
  /** Hanya dikirim saat edit; tempat baru mulai dari 0. */
  kunjungan: z.coerce.number().int('Kunjungan harus angka bulat').min(0).max(9999).optional(),
})

const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl'])

/** Ikuti redirect link pendek Google Maps secara manual (maks 4 lompatan, hanya host Google). */
async function coordsFromLink(link: string): Promise<Coords | null> {
  const direct = parseCoords(link)
  if (direct) return direct

  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }

  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== 'https:') return null
    const isShort = SHORT_HOSTS.has(url.hostname)
    const isGoogle = /(^|\.)google\.[a-z.]+$/.test(url.hostname)
    if (!isShort && !isGoogle) return null

    const found = parseCoords(url.toString())
    if (found) return found
    if (!isShort && hop > 0 && !url.pathname.startsWith('/maps')) return null

    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000) })
    const loc = res.headers.get('location')
    if (!loc) return null
    url = new URL(loc, url)
  }
  return parseCoords(url.toString())
}

export async function saveTempat(input: z.input<typeof SaveInput>) {
  return run(async () => {
    const { id, linkMaps, kunjungan, ...v } = SaveInput.parse(input)

    let coords: Coords | null = null
    if (linkMaps) {
      try {
        coords = await coordsFromLink(linkMaps)
      } catch {
        coords = null // gagal resolve tidak boleh menggagalkan simpan
      }
    }
    const row = {
      ...v,
      link_maps: linkMaps,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      ...(id && kunjungan !== undefined ? { kunjungan } : {}),
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
    return { id: tempatId as string, coordsFound: coords !== null || linkMaps === '' }
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

/** Tambah satu kunjungan (+1). Dibaca lalu ditulis; cukup untuk satu pengguna. */
export async function tambahKunjungan(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    const cur = must(await admin().from('tempat').select('kunjungan').eq('id', id).maybeSingle())
    if (!cur.data) throw new Error('Tempat tidak ditemukan')
    must(await admin().from('tempat').update({ kunjungan: (cur.data.kunjungan as number) + 1 }).eq('id', id))
    revalidatePath('/', 'layout')
  })
}
