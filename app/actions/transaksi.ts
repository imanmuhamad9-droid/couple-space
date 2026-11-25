'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { admin } from '@/lib/supabase-admin'

const Input = z.object({
  id: z.uuid().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  jenis: z.enum(['masuk', 'keluar'], 'Pilih masuk atau keluar'),
  jumlah: z.coerce.number().int('Jumlah harus angka bulat').min(1, 'Isi jumlahnya').max(100_000_000_000_000),
  keterangan: z.string().trim().min(1, 'Isi keterangannya').max(200, 'Keterangan terlalu panjang'),
})

export async function saveTransaksi(input: z.input<typeof Input>) {
  return run(async () => {
    const { id, ...v } = Input.parse(input)
    if (id) must(await admin().from('transaksi').update(v).eq('id', id))
    else must(await admin().from('transaksi').insert(v))
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
