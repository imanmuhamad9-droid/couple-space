'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { must, run } from '@/lib/action'
import { kapitalAwal } from '@/lib/format'
import { admin } from '@/lib/supabase-admin'

const Nama = z.string().trim().min(1, 'Isi nama dompet').max(40, 'Nama dompet terlalu panjang').transform(kapitalAwal)
const Hari = z.number().int('Jumlah hari harus angka bulat').min(1, 'Minimal 1 hari').max(365)
const Jatah = z.number().int('Jatah harus angka bulat').min(1, 'Jatah harus lebih dari 0').max(100_000_000_000_000)

/**
 * Tambah dompet baru (id kosong) atau ubah pengaturannya. `jatah`: angka = set, null = hapus jatah,
 * tidak dikirim = jangan diubah.
 */
export async function saveDompet(input: { id?: string; nama: string; jatah?: number | null; hari?: number | null }) {
  return run(async () => {
    const nama = Nama.parse(input.nama)
    const jatah = input.jatah === undefined ? undefined : input.jatah === null ? null : Jatah.parse(input.jatah)
    const hari = input.hari === undefined || input.hari === null ? input.hari : Hari.parse(input.hari)
    if (input.id) {
      const id = z.uuid().parse(input.id)
      const ada = must(await admin().from('dompet').select('*').eq('id', id).limit(1))
      const jenis = (ada.data?.[0]?.jenis as string | null | undefined) ?? null
      if (jenis === 'tabungan') throw new Error('Dompet Tabungan tidak punya pengaturan')
      if (jenis === 'liburan' && jatah === null) throw new Error('Isi budget liburan')
      must(
        await admin()
          .from('dompet')
          .update({
            // dompet bawaan: nama terkunci
            ...(jenis ? {} : { nama }),
            ...(jatah !== undefined ? { jatah } : {}),
            ...(jenis === 'liburan' && hari !== undefined ? { hari } : {}),
          })
          .eq('id', id),
      )
    } else {
      const last = must(await admin().from('dompet').select('urut').order('urut', { ascending: false }).limit(1))
      const urut = ((last.data?.[0]?.urut as number | undefined) ?? 0) + 1
      must(await admin().from('dompet').insert({ nama, urut, ...(jatah ? { jatah } : {}) }))
    }
    revalidatePath('/', 'layout')
  })
}

/** Simpan urutan dompet: `ids` berisi semua id dompet, dari kartu paling kiri. */
export async function urutkanDompet(ids: string[]) {
  return run(async () => {
    const urutan = z.array(z.uuid()).min(1).max(50).parse(ids)
    if (new Set(urutan).size !== urutan.length) throw new Error('Urutan dompet tidak valid')

    const semua = must(await admin().from('dompet').select('id'))
    const ada = new Set((semua.data ?? []).map((d) => d.id as string))
    if (urutan.length !== ada.size || !urutan.every((id) => ada.has(id))) {
      throw new Error('Daftar dompet sudah berubah. Muat ulang lalu coba lagi.')
    }

    await Promise.all(urutan.map(async (id, i) => must(await admin().from('dompet').update({ urut: i + 1 }).eq('id', id))))
    revalidatePath('/', 'layout')
  })
}

/** Hanya dompet tanpa transaksi (sebagai asal maupun tujuan), dan minimal satu dompet harus tersisa. */
export async function deleteDompet(idRaw: string) {
  return run(async () => {
    const id = z.uuid().parse(idRaw)

    const ada = must(await admin().from('dompet').select('*').eq('id', id).limit(1))
    if (ada.data?.[0]?.jenis) throw new Error('Dompet bawaan tidak bisa dihapus')

    const semua = must(await admin().from('dompet').select('id'))
    if ((semua.data?.length ?? 0) <= 1) throw new Error('Minimal harus ada satu dompet')

    const pakai = must(
      await admin().from('transaksi').select('id').or(`dompet_id.eq.${id},dompet_tujuan_id.eq.${id}`).limit(1),
    )
    if ((pakai.data?.length ?? 0) > 0) throw new Error('Dompet ini sudah punya transaksi, jadi tidak bisa dihapus')

    must(await admin().from('dompet').delete().eq('id', id))
    revalidatePath('/', 'layout')
  })
}
