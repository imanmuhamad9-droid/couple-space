import { formatTanggalSingkat, rupiah } from './format'

export type Pelaku = 'aku' | 'dia'

export type Punya = 'aku' | 'dia' | 'berdua'
/** Satu baris struk; `harga` = total baris itu. */
export type Barang = { nama: string; harga: number; punya: Punya }

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
  /** Rincian per barang; null/kosong = tidak dirinci. */
  rincian?: Barang[] | null
}

export const jumlahBarang = (rincian: Barang[]) => rincian.reduce((s, b) => s + b.harga, 0)

/**
 * Bagian `siapa` dari total struk, sebanding dengan harga barangnya (barang berdua dibagi dua).
 * Selisih total struk dengan jumlah barang (pajak, service, diskon) otomatis ikut terbagi.
 */
export function bagianRincian(rincian: Barang[], total: number, siapa: Pelaku): number {
  const semua = jumlahBarang(rincian)
  if (semua <= 0) return 0
  // dikali dua supaya barang "berdua" tetap bilangan bulat
  const punyaku = rincian.reduce((s, b) => s + (b.punya === siapa ? 2 * b.harga : b.punya === 'berdua' ? b.harga : 0), 0)
  return Number((BigInt(total) * BigInt(punyaku)) / BigInt(2 * semua))
}

/** Nilai yang mengubah saldo. Pembulatan ke bawah: sisa rupiah ditanggung yang menalangi. */
export function nilai(g: Pick<Gantian, 'jenis' | 'jumlah' | 'bagi' | 'pelaku' | 'rincian'>): number {
  if (g.jenis === 'talang' && g.rincian?.length) {
    return bagianRincian(g.rincian, g.jumlah, g.pelaku === 'aku' ? 'dia' : 'aku')
  }
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
    const pemilik = { aku: 'aku', dia: nama, berdua: 'berdua' }
    const rinci = (g.rincian ?? []).map((b) => `\n   ${b.nama} ${rupiah(b.harga)} (${pemilik[b.punya]})`).join('')
    const bagian = rinci ? `\n   Bagian ${g.pelaku === 'aku' ? nama : 'aku'}: ${rupiah(nilai(g))}` : ''
    return `- ${formatTanggalSingkat(g.tanggal)} ${apa}${rinci}${bagian}`
  })
  return [
    '*Rekap Gantian*',
    saldo === 0 ? 'Impas, tidak ada yang perlu dibayar.' : `${kalimatSaldo(saldo, nama)}: *${rupiah(Math.abs(saldo))}*`,
    ...(baris.length ? ['', ...baris] : []),
  ].join('\n')
}
