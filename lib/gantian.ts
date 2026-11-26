import { formatTanggalSingkat, rupiah } from './format'

export type Pelaku = 'aku' | 'dia'

export type Gantian = {
  id: string
  tanggal: string
  jenis: 'talang' | 'bayar'
  /** Siapa yang mengeluarkan uang. */
  pelaku: Pelaku
  jumlah: number
  /** Hanya talang: true = bagi dua. */
  bagi: boolean
  keterangan: string
}

/** Nilai yang mengubah saldo. Bagi dua: sisa rupiah ganjil ditanggung yang menalangi. */
export function nilai(g: Pick<Gantian, 'jenis' | 'jumlah' | 'bagi'>): number {
  return g.jenis === 'talang' && g.bagi ? Math.floor(g.jumlah / 2) : g.jumlah
}

const perubahan = (g: Gantian) => (g.pelaku === 'aku' ? nilai(g) : -nilai(g))

/** Positif = dia berutang ke aku, negatif = aku berutang ke dia. */
export function saldoGantian(items: Gantian[]): number {
  return items.reduce((s, g) => s + perubahan(g), 0)
}

export function kalimatSaldo(saldo: number, nama: string): string {
  if (saldo === 0) return 'Impas'
  return saldo > 0 ? `${nama} harus bayar aku` : `Aku harus bayar ${nama}`
}

/** Catatan sejak terakhir impas. `items` terurut terbaru di atas; hasilnya terlama di atas. */
export function sejakImpas(items: Gantian[]): Gantian[] {
  let saldo = 0
  let hasil: Gantian[] = []
  for (const g of [...items].reverse()) {
    saldo += perubahan(g)
    hasil.push(g)
    if (saldo === 0) hasil = []
  }
  return hasil
}

/** Teks rekap untuk dikirim ke WhatsApp. */
export function rekapGantian(items: Gantian[], nama: string): string {
  const saldo = saldoGantian(items)
  const baris = sejakImpas(items).map((g) => {
    const siapa = g.pelaku === 'aku' ? 'aku' : nama
    const apa =
      g.jenis === 'bayar'
        ? `${siapa} bayar ${rupiah(g.jumlah)}`
        : `${g.keterangan}: ${rupiah(g.jumlah)} (${siapa} yang bayar${g.bagi ? ', bagi dua' : ''})`
    return `- ${formatTanggalSingkat(g.tanggal)} ${apa}`
  })
  return [
    '*Rekap Gantian*',
    saldo === 0 ? 'Impas, tidak ada yang perlu dibayar.' : `${kalimatSaldo(saldo, nama)}: *${rupiah(Math.abs(saldo))}*`,
    ...(baris.length ? ['', ...baris] : []),
  ].join('\n')
}
