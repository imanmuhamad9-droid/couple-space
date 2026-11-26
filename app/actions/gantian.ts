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

/** uuid = catat sebagai uang keluar dari dompet itu, null = tidak dicatat, tidak dikirim = jangan diubah. */
const DompetId = z.uuid('Pilih dompet').nullable().optional()

/** Samakan transaksi di Uang dengan satu catatan gantian. */
async function catatDiUang(
  gantianId: string,
  dompetId: string | null,
  t: { jenis: 'masuk' | 'keluar'; tanggal: string; jumlah: number; keterangan: string },
) {
  const ada = must(await admin().from('transaksi').select('id').eq('gantian_id', gantianId).limit(1))
  const id = ada.data?.[0]?.id as string | undefined
  if (!dompetId) {
    if (id) must(await admin().from('transaksi').delete().eq('id', id))
    return
  }
  const row = { ...t, dompet_id: dompetId, gantian_id: gantianId }
  must(id ? await admin().from('transaksi').update(row).eq('id', id) : await admin().from('transaksi').insert(row))
}

/** Catatan baru: kalau transaksinya gagal dicatat, batalkan juga supaya "Simpan" ulang tidak dobel. */
async function catatAtauBatal(...args: Parameters<typeof catatDiUang>) {
  try {
    await catatDiUang(...args)
  } catch (e) {
    await admin().from('gantian').delete().eq('id', args[0])
    throw e
  }
}

const Talang = z.object({
  dompetId: DompetId,
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
    const { id, dompetId, ...v } = Talang.parse(input)
    if (v.rincian) v.bagi = false
    if (nilai({ ...v, jenis: 'talang' }) < 1) {
      throw new Error(v.rincian ? 'Tidak ada bagian yang perlu ditalangi' : 'Jumlah terlalu kecil untuk dibagi dua')
    }
    // Hanya uang yang keluar dari kantongku yang jadi pengeluaran.
    const dari = v.pelaku === 'aku' ? dompetId : dompetId === undefined ? undefined : null
    const uang = { jenis: 'keluar' as const, tanggal: v.tanggal, jumlah: v.jumlah, keterangan: v.keterangan }
    if (id) {
      must(await admin().from('gantian').update(v).eq('id', id).eq('jenis', 'talang'))
      if (dari !== undefined) await catatDiUang(id, dari, uang)
    } else {
      const res = must(await admin().from('gantian').insert({ ...v, jenis: 'talang' }).select('id').single())
      if (dari) await catatAtauBatal(res.data!.id as string, dari, uang)
    }
    revalidatePath('/', 'layout')
  })
}

const Bayar = z.object({ tanggal: Tanggal, pelaku: Pelaku, jumlah: Jumlah, dompetId: DompetId })

/** Pelunasan penuh/sebagian. Dicek ulang di server supaya tidak tercatat dobel atau melebihi utang. */
export async function bayarGantian(input: z.input<typeof Bayar>) {
  return run(async () => {
    const { dompetId, ...v } = Bayar.parse(input)
    const { items, nama } = await listGantian()
    const saldo = saldoGantian(items)
    const berutang = saldo > 0 ? 'dia' : 'aku'
    if (saldo === 0 || v.pelaku !== berutang) throw new Error('Saldo sudah berubah. Muat ulang lalu coba lagi.')
    if (v.jumlah > Math.abs(saldo)) throw new Error('Melebihi saldo yang harus dibayar')
    const res = must(await admin().from('gantian').insert({ ...v, jenis: 'bayar' }).select('id').single())
    // Aku yang bayar = uang keluar; dia yang bayar ke aku = uang masuk.
    if (dompetId) {
      await catatAtauBatal(res.data!.id as string, dompetId, {
        jenis: v.pelaku === 'aku' ? 'keluar' : 'masuk',
        tanggal: v.tanggal,
        jumlah: v.jumlah,
        keterangan: v.pelaku === 'aku' ? `Bayar gantian ke ${nama}` : `Bayaran gantian dari ${nama}`,
      })
    }
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
