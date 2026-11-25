'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { admin } from '@/lib/supabase-admin'

const Input = z.object({
  id: z.uuid().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  jenis: z.enum(['masuk', 'keluar', 'pindah'], 'Pilih jenis transaksi'),
  jumlah: z.coerce.number().int('Jumlah harus angka bulat').min(1, 'Isi jumlahnya').max(100_000_000_000_000),
  keterangan: z.string().trim().max(200, 'Keterangan terlalu panjang').default(''),
  dompetId: z.uuid('Pilih dompet'),
  /** Hanya untuk pindah dana. */
  tujuanId: z.uuid().nullable().optional(),
})

export async function saveTransaksi(input: z.input<typeof Input>) {
  return run(async () => {
    const { id, dompetId, tujuanId, keterangan, ...v } = Input.parse(input)

    let note = keterangan
    let tujuan: string | null = null
    if (v.jenis === 'pindah') {
      if (!tujuanId) throw new Error('Pilih dompet tujuan')
      if (tujuanId === dompetId) throw new Error('Dompet asal dan tujuan harus berbeda')
      tujuan = tujuanId
      note = keterangan || 'Pindah dana'
    } else if (!keterangan) {
      throw new Error('Isi keterangannya')
    }

    const row = { ...v, keterangan: note, dompet_id: dompetId, dompet_tujuan_id: tujuan }
    if (id) must(await admin().from('transaksi').update(row).eq('id', id))
    else must(await admin().from('transaksi').insert(row))
    revalidatePath('/', 'layout')
  })
}

export async function deleteTransaksi(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    must(await admin().from('transaksi').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}
