export type Item = { id: string; tanggal: string; jam: string; done: boolean }
export type Change = { id: string; tanggal: string; jam: string }

const byJam = (a: Item, b: Item) => a.jam.localeCompare(b.jam)

function toMin(jam: string) {
  const [h, m] = jam.split(':').map(Number)
  return h * 60 + m
}

function toJam(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

/** Jika jam sudah dipakai di hari tujuan, geser per 30 menit sampai kosong. */
function freeSlot(jam: string, taken: Set<string>): string {
  if (!taken.has(jam)) return jam
  const start = toMin(jam)
  for (let m = start + 30; m < 24 * 60; m += 30) if (!taken.has(toJam(m))) return toJam(m)
  for (let m = start - 30; m >= 0; m -= 30) if (!taken.has(toJam(m))) return toJam(m)
  return jam
}

/**
 * Hitung perubahan saat kartu `id` dipindah ke hari `toDay` pada posisi `toIdx`
 * (posisi di antara kartu lain di hari tujuan, tanpa menghitung kartu ini).
 * Jam adalah slot yang tersedia, bukan milik kartu. Hanya mengembalikan yang berubah.
 */
export function moveItem(items: Item[], id: string, toDay: string, toIdx: number): Change[] {
  const moved = items.find((x) => x.id === id)
  if (!moved || moved.done) return []
  const fromDay = moved.tanggal
  const before = new Map(items.map((x) => [x.id, x]))

  const next = items.map((x) => ({ ...x }))
  const m = next.find((x) => x.id === id)!

  if (fromDay === toDay) {
    const all = next.filter((x) => !x.done && x.tanggal === fromDay).sort(byJam)
    const from = all.findIndex((x) => x.id === id)
    if (from < 0 || toIdx === from) return []
    const slots = all.map((x) => x.jam)
    const rest = all.filter((x) => x.id !== id)
    rest.splice(Math.max(0, Math.min(toIdx, rest.length)), 0, m)
    rest.forEach((x, i) => (x.jam = slots[i]))
  } else {
    // hari asal: kartu pergi, slotnya ikut hilang; sisa kartu menerima slot yang tersisa
    const oldAll = next.filter((x) => !x.done && x.tanggal === fromDay).sort(byJam)
    const remSlots = oldAll.map((x) => x.jam)
    remSlots.splice(remSlots.indexOf(moved.jam), 1)
    oldAll.filter((x) => x.id !== id).forEach((x, i) => (x.jam = remSlots[i]))

    // hari tujuan: himpunan jam + jam kartu yang pindah (digeser jika bentrok)
    const newAll = next.filter((x) => !x.done && x.tanggal === toDay && x.id !== id).sort(byJam)
    const taken = new Set(newAll.map((x) => x.jam))
    const newSlots = [...newAll.map((x) => x.jam), freeSlot(moved.jam, taken)].sort()
    newAll.splice(Math.max(0, Math.min(toIdx, newAll.length)), 0, m)
    m.tanggal = toDay
    newAll.forEach((x, i) => (x.jam = newSlots[i]))
  }

  return next
    .filter((x) => {
      const b = before.get(x.id)!
      return !x.done && (b.tanggal !== x.tanggal || b.jam !== x.jam)
    })
    .map((x) => ({ id: x.id, tanggal: x.tanggal, jam: x.jam }))
}

/** Kegiatan terakhir di satu hari dianggap berlangsung selama ini (menit). */
export const DURASI_TERAKHIR = 120

/**
 * Id kegiatan yang sedang berlangsung: dimulai pada jamnya dan berakhir saat kegiatan
 * berikutnya di hari yang sama mulai. Kegiatan terakhir hari itu berlangsung DURASI_TERAKHIR menit.
 */
export function kegiatanBerlangsung(
  items: { id: string; tanggal: string; jam: string }[],
  tanggal: string,
  menit: number,
): string | null {
  const hari = items.filter((x) => x.tanggal === tanggal).sort((a, b) => a.jam.localeCompare(b.jam))
  let aktif: string | null = null
  hari.forEach((x, i) => {
    const mulai = toMin(x.jam)
    const selesai = hari[i + 1] ? toMin(hari[i + 1].jam) : mulai + DURASI_TERAKHIR
    if (menit >= mulai && menit < selesai) aktif = x.id
  })
  return aktif
}
