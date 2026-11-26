'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { listGantian } from '@/lib/data'
import { kapitalAwal } from '@/lib/format'
import { nilai, saldoGantian } from '@/lib/gantian'
import { admin } from '@/lib/supabase-admin'

const Tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const Jumlah = z.number().int('Jumlah harus angka bulat').min(1, 'Isi jumlahnya').max(100_000_000_000_000)
const Pelaku = z.enum(['aku', 'dia'], 'Pilih siapa yang bayar')

const Barang = z.object({
  nama: z.string().trim().min(1, 'Isi nama tiap barang').max(100, 'Nama barang terlalu panjang').transform(kapitalAwal),
  harga: z.number().int('Harga harus angka bulat').min(1, 'Isi harga tiap barang').max(1_000_000_000_000),
  punya: z.enum(['aku', 'dia', 'berdua'], 'Pilih punya siapa'),
})

const Talang = z.object({
  id: z.uuid().optional(),
  tanggal: Tanggal,
  pelaku: Pelaku,
  jumlah: Jumlah,
  bagi: z.boolean(),
  rincian: z.array(Barang).min(1, 'Tambahkan minimal satu barang').max(50, 'Maksimal 50 barang').nullable(),
  keterangan: z.string().trim().min(1, 'Isi untuk apa').max(200, 'Keterangan terlalu panjang').transform(kapitalAwal),
})

export async function saveTalang(input: z.input<typeof Talang>) {
  return run(async () => {
    const { id, ...v } = Talang.parse(input)
    if (v.rincian) v.bagi = false
    if (nilai({ ...v, jenis: 'talang' }) < 1) {
      throw new Error(v.rincian ? 'Tidak ada bagian yang perlu ditalangi' : 'Jumlah terlalu kecil untuk dibagi dua')
    }
    if (id) must(await admin().from('gantian').update(v).eq('id', id).eq('jenis', 'talang'))
    else must(await admin().from('gantian').insert({ ...v, jenis: 'talang' }))
    revalidatePath('/', 'layout')
  })
}

const Bayar = z.object({ tanggal: Tanggal, pelaku: Pelaku, jumlah: Jumlah })

/** Pelunasan penuh/sebagian. Dicek ulang di server supaya tidak tercatat dobel atau melebihi utang. */
export async function bayarGantian(input: z.input<typeof Bayar>) {
  return run(async () => {
    const v = Bayar.parse(input)
    const saldo = saldoGantian((await listGantian()).items)
    const berutang = saldo > 0 ? 'dia' : 'aku'
    if (saldo === 0 || v.pelaku !== berutang) throw new Error('Saldo sudah berubah. Muat ulang lalu coba lagi.')
    if (v.jumlah > Math.abs(saldo)) throw new Error('Melebihi saldo yang harus dibayar')
    must(await admin().from('gantian').insert({ ...v, jenis: 'bayar' }))
    revalidatePath('/', 'layout')
  })
}

export async function deleteGantian(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)
    must(await admin().from('gantian').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}

export async function saveNamaGantian(namaRaw: string) {
  return run(async () => {
    const nama = z.string().trim().min(1, 'Isi namanya').max(30, 'Nama terlalu panjang').transform(kapitalAwal).parse(namaRaw)
    must(await admin().from('gantian_setting').upsert({ id: 1, nama }))
    revalidatePath('/', 'layout')
  })
}
