import { describe, expect, it } from 'vitest'
import { kegiatanBerlangsung, moveItem, type Change, type Item } from '../lib/schedule'

const D1 = '2026-11-24'
const D2 = '2026-11-25'

const it_ = (id: string, tanggal: string, jam: string, done = false): Item => ({ id, tanggal, jam, done })

/** Terapkan perubahan lalu kembalikan id berurutan per hari beserta jamnya. */
function apply(items: Item[], changes: Change[]) {
  const map = new Map(changes.map((c) => [c.id, c]))
  return items.map((x) => ({ ...x, ...(map.get(x.id) ?? {}) }))
}
function day(items: Item[], d: string) {
  return items
    .filter((x) => x.tanggal === d && !x.done)
    .sort((a, b) => a.jam.localeCompare(b.jam))
    .map((x) => `${x.id}@${x.jam}`)
}
function noClash(items: Item[]) {
  for (const d of new Set(items.map((x) => x.tanggal))) {
    const jams = items.filter((x) => x.tanggal === d && !x.done).map((x) => x.jam)
    expect(new Set(jams).size).toBe(jams.length)
  }
}

const base = () => [it_('a', D1, '07:00'), it_('b', D1, '10:00'), it_('c', D1, '13:00')]

describe('moveItem - dalam hari yang sama', () => {
  it('contoh pengguna: kegiatan 1 dipindah ke bawah kegiatan 3 -> urutan 2,3,1 dengan slot tetap', () => {
    const items = base()
    const out = apply(items, moveItem(items, 'a', D1, 2))
    expect(day(out, D1)).toEqual(['b@07:00', 'c@10:00', 'a@13:00'])
    noClash(out)
  })

  it('pindah ke atas', () => {
    const items = base()
    const out = apply(items, moveItem(items, 'c', D1, 0))
    expect(day(out, D1)).toEqual(['c@07:00', 'a@10:00', 'b@13:00'])
  })

  it('posisi yang sama tidak mengubah apa pun', () => {
    expect(moveItem(base(), 'b', D1, 1)).toEqual([])
  })

  it('hanya mengembalikan kartu yang berubah', () => {
    const changes = moveItem(base(), 'a', D1, 1)
    expect(changes.map((c) => c.id).sort()).toEqual(['a', 'b'])
  })
})

describe('moveItem - antar hari', () => {
  const items = () => [...base(), it_('x', D2, '09:00'), it_('y', D2, '15:00')]

  it('masuk di tengah hari tujuan; slot hari asal merapat', () => {
    const src = items()
    const out = apply(src, moveItem(src, 'b', D2, 1))
    expect(day(out, D1)).toEqual(['a@07:00', 'c@13:00'])
    expect(day(out, D2)).toEqual(['x@09:00', 'b@10:00', 'y@15:00'])
    noClash(out)
  })

  it('jam bentrok di hari tujuan digeser, tidak pernah kembar', () => {
    const src = [it_('a', D1, '09:00'), it_('x', D2, '09:00'), it_('y', D2, '09:30')]
    const out = apply(src, moveItem(src, 'a', D2, 0))
    expect(day(out, D1)).toEqual([])
    expect(out.filter((x) => x.tanggal === D2)).toHaveLength(3)
    noClash(out)
  })

  it('pindah ke hari tujuan yang lebih awal/akhir tetap tanpa bentrok', () => {
    const src = items()
    noClash(apply(src, moveItem(src, 'a', D2, 0)))
    noClash(apply(src, moveItem(src, 'c', D2, 2)))
  })
})

describe('moveItem - histori', () => {
  it('kegiatan terlaksana tidak bisa dipindah', () => {
    const src = [it_('h', D1, '08:00', true), it_('a', D1, '10:00')]
    expect(moveItem(src, 'h', D2, 0)).toEqual([])
  })

  it('kegiatan terlaksana tidak ikut berubah saat rencana dipindah', () => {
    const src = [it_('h', D1, '08:00', true), it_('a', D1, '10:00'), it_('b', D1, '12:00')]
    const changes = moveItem(src, 'a', D1, 1)
    expect(changes.find((c) => c.id === 'h')).toBeUndefined()
  })

  it('id tidak dikenal mengembalikan kosong', () => {
    expect(moveItem(base(), 'zzz', D1, 0)).toEqual([])
  })
})

describe('kegiatanBerlangsung', () => {
  const hari = [
    { id: 'a', tanggal: D1, jam: '07:00' },
    { id: 'b', tanggal: D1, jam: '10:00' },
    { id: 'c', tanggal: D1, jam: '13:00' },
    { id: 'z', tanggal: D2, jam: '09:00' },
  ]
  const m = (h: number, min = 0) => h * 60 + min

  it('belum ada yang mulai', () => expect(kegiatanBerlangsung(hari, D1, m(6, 59))).toBeNull())
  it('tepat pada jam mulai', () => expect(kegiatanBerlangsung(hari, D1, m(7))).toBe('a'))
  it('berlangsung sampai kegiatan berikutnya mulai', () => {
    expect(kegiatanBerlangsung(hari, D1, m(9, 59))).toBe('a')
    expect(kegiatanBerlangsung(hari, D1, m(10))).toBe('b')
  })
  it('kegiatan terakhir berlangsung 2 jam', () => {
    expect(kegiatanBerlangsung(hari, D1, m(14, 59))).toBe('c')
    expect(kegiatanBerlangsung(hari, D1, m(15))).toBeNull()
  })
  it('hari lain tidak ikut', () => expect(kegiatanBerlangsung(hari, D2, m(8))).toBeNull())
})
