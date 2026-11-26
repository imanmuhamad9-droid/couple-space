import {
  Banknote,
  CalendarDays,
  Car,
  CreditCard,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  Plane,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { createElement } from 'react'
import type { Dompet } from '@/lib/types'

const BAWAAN = { bulanan: CalendarDays, tabungan: PiggyBank, liburan: Plane }

// Dicocokkan berurutan, jadi yang lebih khusus ditaruh di atas ("Dana darurat" sebelum e-wallet "Dana").
const KATA: [RegExp, LucideIcon][] = [
  [/darurat/, ShieldAlert],
  [/tunai|cash|kas\b|dompet fisik/, Banknote],
  [/gopay|go-pay|ovo|\bdana\b|shopee ?pay|link ?aja|e-?wallet|e-?money|flazz/, Smartphone],
  [/kartu|kredit|paylater|debit/, CreditCard],
  [/bank|rekening|bca|bni|bri|mandiri|\bbsi\b|jago|jenius|seabank|cimb/, Landmark],
  [/invest|saham|reksa|emas|crypto|kripto|deposito/, TrendingUp],
  [/tabung|nabung|simpan/, PiggyBank],
  [/liburan|travel|trip|jalan-jalan|umroh|haji/, Plane],
  [/rumah|kontrakan|kos\b|kost|listrik/, House],
  [/mobil|motor|bensin|transport|kendaraan/, Car],
  [/makan|jajan|dapur/, Utensils],
  [/belanja|shopping/, ShoppingCart],
  [/sekolah|kuliah|pendidikan|kursus/, GraduationCap],
  [/sehat|kesehatan|obat|dokter|bpjs/, HeartPulse],
  [/ortu|orang tua|keluarga|anak|adik|ibu|ayah|mama|papa/, Users],
  [/hadiah|kado|sedekah|zakat|donasi|amal|nikah/, Gift],
  [/tagihan|cicilan|utang|hutang|arisan/, Receipt],
]

/** Ikon dompet: bawaan menurut jenisnya, buatan sendiri menurut kata di namanya (cadangan: ikon dompet). */
export function ikonDompet({ jenis, nama }: Pick<Dompet, 'jenis' | 'nama'>): LucideIcon {
  if (jenis) return BAWAAN[jenis]
  const n = nama.toLowerCase()
  return KATA.find(([pola]) => pola.test(n))?.[1] ?? Wallet
}

export function IkonDompet({ dompet }: { dompet: Dompet | null }) {
  // null = kartu "Keseluruhan"
  return createElement(dompet ? ikonDompet(dompet) : Wallet, { size: 15, className: 'shrink-0', 'aria-hidden': true })
}
