'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { kapitalAwal } from '@/lib/format'
import { admin } from '@/lib/supabase-admin'

const Input = z.object({
  id: z.uuid().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  jenis: z.enum(['masuk', 'keluar', 'pindah'], 'Pilih jenis transaksi'),
  jumlah: z.coerce.number().int('Jumlah harus angka bulat').min(1, 'Isi jumlahnya').max(100_000_000_000_000),
  keterangan: z.string().trim().max(200, 'Keterangan terlalu panjang').transform(kapitalAwal).default(''),
  dompetId: z.uuid('Pilih dompet'),
  /** Hanya untuk pindah dana. */
  tujuanId: z.uuid().nullable().optional(),
  /** Tidak dikirim = jangan diubah. */
  kewajiban: z.boolean().optional(),
})

/** Transaksi dari Gantian dikunci, supaya catatan di kedua menu tidak berbeda. */
async function tolakDariGantian(id: string) {
  const ada = must(await admin().from('transaksi').select('*').eq('id', id).limit(1))
  if (ada.data?.[0]?.gantian_id) throw new Error('Transaksi ini dari Gantian. Ubah dari menu Gantian.')
}

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

    if (id) await tolakDariGantian(id)
    const row = { ...v, keterangan: note, dompet_id: dompetId, dompet_tujuan_id: tujuan }
    const res = id
      ? await admin().from('transaksi').update(row).eq('id', id)
      : await admin().from('transaksi').insert(row)
    if (res.error && /kewajiban/.test(res.error.message)) throw new Error('Jalankan dulu migrasi 0013 di Supabase')
    must(res)
    revalidatePath('/', 'layout')
  })
}

export async function deleteTransaksi(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    await tolakDariGantian(id)
    must(await admin().from('transaksi').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}

/** Satu-satunya yang boleh diubah di Uang untuk transaksi dari Gantian. */
export async function setKewajiban(idRaw: string, nilai: boolean) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    const res = await admin().from('transaksi').update({ kewajiban: z.boolean().parse(nilai) }).eq('id', id).eq('jenis', 'keluar')
    if (res.error && /kewajiban/.test(res.error.message)) throw new Error('Jalankan dulu migrasi 0013 di Supabase')
    must(res)
    revalidatePath('/', 'layout')
  })
}
