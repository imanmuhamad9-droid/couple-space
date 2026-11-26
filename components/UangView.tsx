'use client'

import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Handshake, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type FormEvent, type UIEvent } from 'react'
import { deleteDompet, saveDompet, selesaiLiburan, urutkanDompet } from '@/app/actions/dompet'
import { deleteTransaksi, setKewajiban } from '@/app/actions/transaksi'
import { useHorizontalReorder } from '@/hooks/useHorizontalReorder'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { angka as rb, formatTanggal, formatTanggalSingkat, kapitalAwal, nowJakarta, rupiah } from '@/lib/format'
import type { Dompet, Transaksi } from '@/lib/types'
import { bulananHarian, geser, jatahInfo, labelPeriode, liburanInfo, milikDompet, periodeDari, ringkasan, totalHarian, type Status } from '@/lib/uang'
import { pindahUrut } from '@/lib/urut'
import { useFeedback } from './Feedback'
import { GrafikMinggu } from './GrafikMinggu'
import { IkonDompet } from './IkonDompet'
import { ConfirmSheet, Sheet } from './Sheet'
import { TransaksiForm } from './TransaksiForm'
import { Empty, Field, inputCls, PageHeader, Pagination, SearchBox, SubmitButton } from './ui'

const SEMUA = 'semua'
const TAMBAH = 'tambah'

// Warna kartu per dompet (mengikuti urutan kartu). Kartu "Keseluruhan" sengaja gelap dan netral.
const WARNA = [
  'from-blue-700 to-sky-500',
  'from-emerald-700 to-emerald-500',
  'from-violet-700 to-violet-500',
  'from-amber-600 to-amber-400',
  'from-rose-700 to-rose-500',
]

const jarak = 8 // gap-2 antar kartu (px), dipakai untuk menghitung posisi geser


/** Isi sheet pengaturan dompet (muncul saat kartu dompet ditekan): nama, jatah per periode, hapus. */
function DompetForm({
  initial,
  onDone,
  onAskDelete,
  onAskSelesai,
  alasanTerkunci,
}: {
  initial: Dompet | null
  onDone: () => void
  onAskDelete: () => void
  /** Dompet Liburan yang sudah ada pengeluarannya: tutup dan mulai hitungan baru. */
  onAskSelesai: (() => void) | null
  /** Alasan dompet tidak bisa dihapus (null = boleh). */
  alasanTerkunci: string | null
}) {
  const { track } = useFeedback()
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [jatah, setJatah] = useState(initial?.jatah ? String(initial.jatah) : '')
  const [hari, setHari] = useState(initial?.hari ? String(initial.hari) : '')
  const jenis = initial?.jenis ?? null
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const baru = jatah === '' ? null : Number(jatah)
    const berubah = baru !== (initial?.jatah ?? null) // jatah hanya dikirim jika berubah
    const r = await track(
      jenis === 'liburan'
        ? saveDompet({ id: initial?.id, nama, jatah: baru, hari: Number(hari) })
        : saveDompet({ id: initial?.id, nama, ...(berubah ? { jatah: baru } : {}) }),
      'Tersimpan',
    )
    setBusy(false)
    if (r.ok) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!jenis && (
      <Field label="Nama dompet">
        <input
          required
          maxLength={40}
          value={nama}
          onChange={(e) => setNama(kapitalAwal(e.target.value))}
          placeholder="Contoh: Dana darurat"
          className={inputCls}
        />
      </Field>
      )}
      <div>
        <Field label={jenis === 'liburan' ? 'Budget liburan (Rp)' : 'Jatah per periode gajian (Rp)'}>
          <input
            required={jenis === 'liburan'}
            inputMode="numeric"
            autoComplete="off"
            value={jatah ? rb(Number(jatah)) : ''}
            onChange={(e) => setJatah(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder="Contoh: 3.000.000"
            className={inputCls}
          />
        </Field>
        <p className="mt-1 text-xs text-muted">
          {jenis === 'bulanan'
            ? 'Dibagi rata per hari selama periode gajian. Sisa hari ini tidak dibawa ke besok.'
            : jenis === 'liburan'
              ? 'Total uang untuk sekali liburan.'
              : 'Kosongkan kalau tidak perlu. Kalau diisi, kartu menampilkan terpakai, sisa jatah, dan batas pengeluaran per hari.'}
        </p>
      </div>
      {jenis === 'liburan' && (
        <div>
          <Field label="Lama liburan (hari)">
            <input
              required
              inputMode="numeric"
              autoComplete="off"
              value={hari}
              onChange={(e) => setHari(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="Contoh: 2"
              className={inputCls}
            />
          </Field>
          <p className="mt-1 text-xs text-muted">Sisa jajan hari ini dibawa ke hari berikutnya.</p>
        </div>
      )}
      <SubmitButton busy={busy}>{initial ? 'Simpan' : 'Tambah dompet'}</SubmitButton>
      {onAskSelesai && (
        <button type="button" onClick={onAskSelesai} className="h-11 w-full rounded-xl bg-done/10 font-semibold text-done">
          Liburan selesai, mulai baru
        </button>
      )}
      {initial && !jenis && (
        <>
          <button
            type="button"
            onClick={onAskDelete}
            disabled={alasanTerkunci !== null}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-del/10 font-semibold text-del disabled:opacity-40"
          >
            <Trash2 size={17} /> Hapus dompet
          </button>
          {alasanTerkunci && <p className="text-center text-xs text-muted">{alasanTerkunci}</p>}
        </>
      )}
    </form>
  )
}

export function UangView({ items, dompet, today }: { items: Transaksi[]; dompet: Dompet[]; today: string }) {
  const { track } = useFeedback()
  const sekarang = periodeDari(today)
  const [per, setPer] = useState(sekarang)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0) // kartu yang sedang terlihat; 0 = dompet pertama (Bulanan)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaksi | null>(null)
  const [selected, setSelected] = useState<Transaksi | null>(null)
  const [deleting, setDeleting] = useState<Transaksi | null>(null)
  const [dompetSheet, setDompetSheet] = useState<{ edit: Dompet | null } | null>(null)
  const [hapusDompet, setHapusDompet] = useState<Dompet | null>(null)
  const [tutupLiburan, setTutupLiburan] = useState<Dompet | null>(null)
  const [grafik, setGrafik] = useState<'masuk' | 'keluar' | null>(null)
  const rail = useRef<HTMLDivElement>(null)
  const bolehKlik = useRef(true) // dimatikan sebentar setelah geseran: klik yang ikut muncul saat jari dilepas diabaikan

  // Urutan hasil geser ditampilkan langsung (optimistis) sampai data dari server tiba.
  const [lastDompet, setLastDompet] = useState(dompet)
  const [urutLokal, setUrutLokal] = useState<string[] | null>(null)
  if (dompet !== lastDompet) {
    setLastDompet(dompet)
    setUrutLokal(null)
  }
  const dompetUrut = useMemo(
    () => (urutLokal ? [...dompet].sort((a, b) => urutLokal.indexOf(a.id) - urutLokal.indexOf(b.id)) : dompet),
    [dompet, urutLokal],
  )

  const nama = useMemo(() => new Map(dompetUrut.map((d) => [d.id, d.nama])), [dompetUrut])

  // Kartu: semua dompet, lalu "Keseluruhan" (disembunyikan di ujung), lalu kartu putih "+ Dompet" paling pojok.
  const kartu = useMemo(
    () => [
      ...dompetUrut.map((d) => ({ id: d.id, dompet: d as Dompet | null })),
      { id: SEMUA, dompet: null },
      { id: TAMBAH, dompet: null },
    ],
    [dompetUrut],
  )
  // Kartu "+ Dompet" bukan data: di sana tampilan di bawah tetap mengikuti "Keseluruhan".
  const nyata = kartu.filter((k) => k.id !== TAMBAH)
  const aktif = nyata[Math.min(idx, nyata.length - 1)]
  const aktifId = aktif.id === SEMUA ? null : aktif.id

  function posisiKartu(i: number) {
    const el = rail.current
    const first = el?.firstElementChild as HTMLElement | null
    return el && first ? { el, left: i * (first.offsetWidth + jarak) } : null
  }
  function keKartu(i: number) {
    const p = posisiKartu(i)
    if (p) p.el.scrollTo({ left: p.left, behavior: 'smooth' })
  }

  // Dompet baru muncul setelah dompet terakhir: geser ke sana.
  const prevLen = useRef(dompet.length)
  useEffect(() => {
    if (dompet.length > prevLen.current) {
      const el = rail.current
      const first = el?.firstElementChild as HTMLElement | null
      if (el && first) el.scrollTo({ left: (dompet.length - 1) * (first.offsetWidth + jarak), behavior: 'smooth' })
    }
    prevLen.current = dompet.length
  }, [dompet.length])

  // Tekan lama kartu dompet lalu geser kiri/kanan untuk mengubah urutan.
  const { dragId, dx, barX, bind } = useHorizontalReorder({
    rail,
    enabled: dompetUrut.length > 1,
    onDrop: async (id, posisi) => {
      bolehKlik.current = false
      setTimeout(() => {
        bolehKlik.current = true
      }, 400)
      const ids = dompetUrut.map((d) => d.id)
      const baru = pindahUrut(ids, id, posisi)
      const tujuan = baru.indexOf(id)
      setTimeout(() => keKartu(tujuan), 60) // kartu kembali ke ukuran normal, lalu tampilkan kartu yang dipindah
      if (baru.join() === ids.join()) return
      setUrutLokal(baru)
      const r = await track(urutkanDompet(baru), undefined, 'Menyimpan urutan...')
      if (!r.ok) setUrutLokal(null)
    },
  })
  const kompak = dragId !== null

  function onScroll(e: UIEvent<HTMLDivElement>) {
    if (kompak) return
    const el = e.currentTarget
    const first = el.firstElementChild as HTMLElement | null
    if (first) setIdx(Math.round(el.scrollLeft / (first.offsetWidth + jarak)))
  }

  // items sudah terurut terbaru di atas, jadi yang terakhir adalah yang tertua.
  const tertua = items.length ? items[items.length - 1].tanggal : today
  const bisaMundur = per.start > tertua
  const bisaMaju = per.start < sekarang.start

  const { masuk, keluar } = ringkasan(items, per, aktifId)
  // Saat mencari, semua periode ikut dicari (dalam dompet yang sedang dilihat).
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const cocok = (t: Transaksi) => {
    const h = [t.keterangan, formatTanggal(t.tanggal), t.jumlah, rupiah(t.jumlah), nama.get(t.dompetId), nama.get(t.tujuanId ?? '')]
      .join(' ')
      .toLowerCase()
    return words.every((w) => h.includes(w))
  }
  const daftar = items.filter(
    (t) => milikDompet(t, aktifId) && (words.length ? cocok(t) : t.tanggal >= per.start && t.tanggal <= per.end),
  )
  // Dompet Liburan: riwayat dikelompokkan per liburan (yang berjalan di atas), dipisah garis.
  const diLiburan = aktif.dompet?.jenis === 'liburan'
  const cap = (t: Transaksi) => (diLiburan ? (t.liburanSelesai ?? '') : '')
  if (diLiburan) daftar.sort((a, b) => (cap(b) || '~').localeCompare(cap(a) || '~')) // '~' = belum ditutup

  const pages = Math.max(1, Math.ceil(daftar.length / ITEM_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const tampil = daftar.slice(cur * ITEM_PER_HALAMAN, (cur + 1) * ITEM_PER_HALAMAN)
  const kelompok = [...new Set(tampil.map((t) => `${cap(t)}|${t.tanggal}`))].map((key) => {
    const [selesai, tanggal] = key.split('|')
    return { key, selesai, tanggal }
  })
  const terpakaiLiburan = (selesai: string) =>
    items.reduce(
      (s, t) => (t.liburanSelesai === selesai && t.jenis === 'keluar' && t.dompetId === aktifId ? s + t.jumlah : s),
      0,
    )

  function ganti(delta: number) {
    setPer(geser(per, delta))
    setPage(0)
  }

  /** Isi kartu per jenis dompet. Tabungan: tidak ada target, hanya saldo. */
  function rincianKartu(d: Dompet): { persen: number; status: Status; l1: string; l2: string; l3?: string } | null {
    if (d.jenis === 'tabungan' || !d.jatah) return null
    if (d.jenis === 'liburan') {
      if (!d.hari) return null
      const r = liburanInfo(items, d.id, d.jatah, d.hari, today)
      return {
        persen: r.persen,
        status: r.status,
        l1: `Hari ke-${r.hariKe} dari ${d.hari} · ${rupiah(r.perHari)}/hari`,
        l2: r.bolehHariIni >= 0 ? `Boleh dipakai ${rupiah(r.bolehHariIni)}` : `Lewat ${rupiah(-r.bolehHariIni)}`,
        l3: `Terpakai ${rupiah(r.terpakai)} dari ${rupiah(d.jatah)}`,
      }
    }
    const p = jatahInfo(items, per, d.id, d.jatah, today)
    if (d.jenis === 'bulanan' && per.start === sekarang.start) {
      const h = bulananHarian(items, per, d.id, d.jatah, today)
      return {
        persen: h.persen,
        status: p.lewat ? 'lewat' : h.status, // jatah periode habis tetap merah walau hari ini hemat
        l1: `Hari ini ${rupiah(h.terpakai)} dari ${rupiah(h.batas)}`,
        l2: h.sisa >= 0 ? `Sisa hari ini ${rupiah(h.sisa)}` : `Lewat ${rupiah(-h.sisa)}`,
      }
    }
    return {
      persen: p.persen,
      status: p.lewat ? 'lewat' : 'aman',
      l1: `Terpakai ${rupiah(p.terpakai)} dari ${rupiah(d.jatah)}`,
      l2: p.lewat ? `Lewat ${rupiah(-p.sisa)}` : `Sisa ${rupiah(p.sisa)}${p.perHari !== null ? ` · ${rupiah(p.perHari)}/hari` : ''}`,
    }
  }

  function bukaPengaturan(d: Dompet) {
    if (!bolehKlik.current || d.jenis === 'tabungan') return
    setDompetSheet({ edit: d })
  }

  function bukaForm(t: Transaksi | null) {
    setEditing(t)
    setFormOpen(true)
  }

  // Tampilan satu baris riwayat, menyesuaikan dompet yang sedang dilihat.
  function baris(t: Transaksi) {
    if (t.jenis === 'pindah') {
      const dari = nama.get(t.dompetId) ?? '?'
      const ke = nama.get(t.tujuanId ?? '') ?? '?'
      const catatan = t.keterangan !== 'Pindah dana' ? t.keterangan : null
      if (aktifId === null) return { judul: `${dari} → ${ke}`, sub: catatan, jumlah: rupiah(t.jumlah), warna: 'text-upload' }
      const keluarDariSini = t.dompetId === aktifId
      return {
        judul: keluarDariSini ? `Pindah ke ${ke}` : `Pindah dari ${dari}`,
        sub: catatan,
        jumlah: `${keluarDariSini ? '−' : '+'} ${rupiah(t.jumlah)}`,
        warna: 'text-upload',
      }
    }
    return {
      judul: t.keterangan,
      sub: [aktifId === null ? nama.get(t.dompetId) : null, t.kewajiban ? 'Kewajiban' : null].filter(Boolean).join(' · ') || null,
      jumlah: `${t.jenis === 'masuk' ? '+' : '−'} ${rupiah(t.jumlah)}`,
      warna: t.jenis === 'masuk' ? 'text-done' : 'text-del',
    }
  }

  const nav = 'grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30'
  const judulRiwayat = aktifId === null ? 'Riwayat · Semua dompet' : `Riwayat · ${nama.get(aktifId) ?? ''}`

  // Dompet yang sedang diedit tidak boleh dihapus jika sudah punya transaksi atau tinggal satu.
  const editDompet = dompetSheet?.edit ?? null
  const alasanTerkunci =
    editDompet === null
      ? null
      : dompet.length <= 1
        ? 'Minimal harus ada satu dompet.'
        : items.some((t) => t.dompetId === editDompet.id || t.tujuanId === editDompet.id)
          ? 'Dompet ini sudah punya transaksi, jadi tidak bisa dihapus.'
          : null

  const detail = selected ? baris(selected) : null
  const punyaJatah = (id: string) => {
    const d = dompet.find((x) => x.id === id)
    return d?.jenis !== 'liburan' && (d?.jenis === 'bulanan' || !!d?.jatah)
  }
  const lebarKartu = kompak ? 'w-[42%]' : 'w-[86%]'

  return (
    <>
      <PageHeader
        title="Uang"
        info="uang"
        right={
          <Link
            href="/gantian"
            aria-label="Gantian (saling talangin)"
            className="grid size-8 place-items-center rounded-full bg-gray-200 text-muted"
          >
            <Handshake size={16} />
          </Link>
        }
      />

      {/* Kartu dompet: geser ke samping. Tekan lama kartu dompet lalu geser untuk mengubah urutan. */}
      <div
        ref={rail}
        onScroll={onScroll}
        className={`relative flex gap-2 overflow-x-auto px-[7%] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          kompak ? '' : 'snap-x snap-mandatory'
        }`}
      >
        {kartu.map((k, i) => {
          if (k.id === TAMBAH) {
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setDompetSheet({ edit: null })}
                className={`${lebarKartu} grid shrink-0 snap-center place-items-center rounded-2xl bg-white text-base font-semibold text-upload shadow-sm active:bg-gray-50`}
              >
                + Dompet
              </button>
            )
          }

          const saldo = ringkasan(items, undefined, k.id === SEMUA ? null : k.id).saldo
          const rin = k.dompet ? rincianKartu(k.dompet) : null
          const warna =
            k.id === SEMUA
              ? 'from-slate-800 to-slate-600'
              : saldo < 0 || rin?.status === 'lewat'
                ? 'from-red-700 to-red-500'
                : rin?.status === 'dekat'
                  ? 'from-amber-600 to-orange-400'
                  : WARNA[i % WARNA.length]
          const digeser = k.id === dragId

          return (
            <section
              key={k.id}
              data-wallet-id={k.dompet ? k.id : undefined}
              {...(k.dompet ? bind(k.id) : {})}
              role={k.dompet ? 'button' : undefined}
              tabIndex={k.dompet ? 0 : undefined}
              aria-label={k.dompet ? `Pengaturan dompet ${k.dompet.nama}` : undefined}
              onClick={k.dompet ? () => bukaPengaturan(k.dompet!) : undefined}
              onKeyDown={
                k.dompet
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        bukaPengaturan(k.dompet!)
                      }
                    }
                  : undefined
              }
              style={digeser ? { transform: `translateX(${dx}px) scale(1.05)` } : undefined}
              className={`relative ${lebarKartu} shrink-0 snap-center select-none rounded-2xl bg-gradient-to-br p-4 text-white [-webkit-touch-callout:none] ${warna} ${
                digeser ? 'z-20 shadow-2xl' : 'shadow-md'
              } ${k.dompet ? 'cursor-pointer' : ''}`}
            >
              <p className="flex items-center gap-1.5 pr-24 text-sm opacity-85">
                <IkonDompet dompet={k.dompet} />
                <span className="truncate">{k.dompet ? k.dompet.nama : 'Keseluruhan'}</span>
              </p>
              <p className={`mt-0.5 truncate font-bold tabular-nums ${kompak ? 'text-lg' : 'text-3xl'}`}>
                {saldo < 0 ? '−' : ''}
                {rupiah(Math.abs(saldo))}
              </p>
              {!kompak &&
                (rin ? (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-white" style={{ width: `${rin.persen}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs">{rin.l1}</p>
                    <p className="text-xs font-medium">{rin.l2}</p>
                    {rin.l3 && <p className="text-xs opacity-75">{rin.l3}</p>}
                  </div>
                ) : (
                  <p className="mt-1 text-xs opacity-75">{k.dompet ? 'Saldo dompet' : 'Total semua dompet'}</p>
                ))}
              {rin && rin.status !== 'aman' && !kompak && (
                <span className="absolute right-3.5 top-3.5 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold">
                  {rin.status === 'lewat' ? 'Lewat batas' : 'Hampir habis'}
                </span>
              )}
            </section>
          )
        })}
        {barX !== null && (
          <div className="pointer-events-none absolute bottom-1 top-0 z-30 w-1 rounded-full bg-upload" style={{ left: barX }} />
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        {kartu.map((k, i) => (
          <button
            key={k.id}
            type="button"
            onClick={() => keKartu(i)}
            aria-label={k.id === TAMBAH ? 'Tambah dompet' : k.dompet ? `Dompet ${k.dompet.nama}` : 'Keseluruhan'}
            className={`h-1.5 rounded-full transition-all ${i === Math.min(idx, kartu.length - 1) ? 'w-4 bg-upload' : 'w-1.5 bg-gray-300'}`}
          />
        ))}
      </div>

      <div className="mx-3 mb-2 mt-3 flex items-center justify-between">
        <button type="button" aria-label="Periode sebelumnya" disabled={!bisaMundur} onClick={() => ganti(-1)} className={nav}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[11px] text-muted">{per.start === sekarang.start ? 'Periode gajian ini' : 'Periode gajian'}</p>
          <p className="text-sm font-semibold">{labelPeriode(per)}</p>
        </div>
        <button type="button" aria-label="Periode berikutnya" disabled={!bisaMaju} onClick={() => ganti(1)} className={nav}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mx-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setGrafik('masuk')} className="min-w-0 rounded-xl bg-white p-3 text-left shadow-sm active:bg-gray-50">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowDownLeft size={14} className="text-done" /> Uang masuk
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-done">+ {rupiah(masuk)}</p>
        </button>
        <button type="button" onClick={() => setGrafik('keluar')} className="min-w-0 rounded-xl bg-white p-3 text-left shadow-sm active:bg-gray-50">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowUpRight size={14} className="text-del" /> Uang keluar
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-del">− {rupiah(keluar)}</p>
        </button>
      </div>

      <div className="mt-3">
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(0)
          }}
          placeholder="Cari transaksi..."
          left={
            <button
              type="button"
              onClick={() => bukaForm(null)}
              aria-label="Tambah transaksi"
              className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-upload px-4 text-sm font-semibold text-white active:scale-[0.99]"
            >
              <Plus size={18} /> Tambah
            </button>
          }
        />
      </div>

      <h2 className="mx-4 mb-1 mt-2 text-xs font-semibold text-muted">{judulRiwayat}</h2>
      {daftar.length === 0 ? (
        <Empty>{words.length ? 'Tidak ada yang cocok.' : 'Belum ada transaksi di periode ini.'}</Empty>
      ) : (
        kelompok.map(({ key, selesai, tanggal: tgl }, i) => (
          <section key={key} className="mx-3 mb-3">
            {selesai && selesai !== kelompok[i - 1]?.selesai && (
              <p className="mb-3 mt-4 flex items-center gap-2 text-xs font-semibold text-muted before:h-px before:flex-1 before:bg-gray-300 after:h-px after:flex-1 after:bg-gray-300">
                Liburan selesai {formatTanggalSingkat(nowJakarta(Date.parse(selesai)).tanggal)} ·{' '}
                {rupiah(terpakaiLiburan(selesai))}
              </p>
            )}
            <div className="mb-1 flex items-center justify-between gap-2 px-1 text-xs font-semibold">
              <h3 className="min-w-0 text-muted">{formatTanggal(tgl)}</h3>
              <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5">
                {daftar.filter((t) => t.tanggal === tgl && cap(t) === selesai).length} transaksi
              </span>
            </div>
            <div className="space-y-1.5">
              {tampil
                .filter((t) => t.tanggal === tgl && cap(t) === selesai)
                .map((t) => {
                  const b = baris(t)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelected(t)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm active:bg-gray-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{b.judul}</span>
                        {b.sub && <span className="block truncate text-xs text-muted">{b.sub}</span>}
                      </span>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${b.warna}`}>{b.jumlah}</span>
                    </button>
                  )
                })}
            </div>
          </section>
        ))
      )}

      <Pagination page={cur} pages={pages} onChange={setPage} />

      <Sheet
        open={grafik !== null}
        title={`Uang ${grafik ?? ''} · ${aktifId === null ? 'Semua dompet' : (nama.get(aktifId) ?? '')}`}
        onClose={() => setGrafik(null)}
      >
        {grafik && (
          <GrafikMinggu
            data={totalHarian(items, grafik, aktifId, today)}
            warna={grafik === 'masuk' ? 'text-done' : 'text-del'}
          />
        )}
      </Sheet>

      <Sheet open={selected !== null} title="Transaksi" onClose={() => setSelected(null)}>
        {selected && detail && (
          <div className="space-y-4">
            <div>
              <p className={`text-2xl font-bold tabular-nums ${detail.warna}`}>
                {selected.jenis === 'pindah' ? rupiah(selected.jumlah) : detail.jumlah}
              </p>
              {selected.keterangan !== 'Pindah dana' && <p className="mt-1 break-words font-medium">{selected.keterangan}</p>}
              <dl className="mt-3 divide-y divide-line text-sm">
                {[
                  ['Tanggal', formatTanggal(selected.tanggal)],
                  ['Jenis', selected.jenis === 'masuk' ? 'Uang masuk' : selected.jenis === 'keluar' ? 'Uang keluar' : 'Pindah dana'],
                  ...(selected.jenis === 'pindah'
                    ? [
                        ['Dari dompet', nama.get(selected.dompetId) ?? '?'],
                        ['Ke dompet', nama.get(selected.tujuanId ?? '') ?? '?'],
                      ]
                    : [['Dompet', nama.get(selected.dompetId) ?? '?']]),
                  ...(selected.kewajiban ? [['Kewajiban', 'Ya']] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-1.5">
                    <dt className="shrink-0 text-muted">{k}</dt>
                    <dd className="min-w-0 break-words text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {selected.dariGantian ? (
              <div className="space-y-3">
                {selected.jenis === 'keluar' && punyaJatah(selected.dompetId) && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.kewajiban ?? false}
                      onChange={async (e) => {
                        const kewajiban = e.target.checked
                        setSelected({ ...selected, kewajiban })
                        const r = await track(setKewajiban(selected.id, kewajiban), 'Tersimpan')
                        if (!r.ok) setSelected(selected)
                      }}
                      className="size-5 accent-upload"
                    />
                    <span>
                      Kewajiban <span className="text-muted">(tidak dihitung ke jatah)</span>
                    </span>
                  </label>
                )}
                <Link
                  href="/gantian"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-100 text-sm font-semibold"
                >
                  <Handshake size={17} /> Ubah dari menu Gantian
                </Link>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const t = selected
                  setSelected(null)
                  bukaForm(t)
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-edit/10 font-semibold text-edit"
              >
                <Pencil size={17} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleting(selected)
                  setSelected(null)
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-del/10 font-semibold text-del"
              >
                <Trash2 size={17} /> Hapus
              </button>
            </div>
            )}
          </div>
        )}
      </Sheet>

      <Sheet open={formOpen} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={() => setFormOpen(false)}>
        <TransaksiForm
          initial={editing}
          today={today}
          dompet={dompetUrut}
          dompetAwal={aktifId ?? dompetUrut[0]?.id ?? ''}
          riwayat={items}
          onDone={(tanggal) => {
            setFormOpen(false)
            // Pindah ke periode transaksi yang baru disimpan supaya langsung terlihat.
            setPer(periodeDari(tanggal))
            setPage(0)
          }}
        />
      </Sheet>

      <Sheet
        open={dompetSheet !== null}
        title={editDompet ? `Pengaturan ${editDompet.nama}` : 'Tambah Dompet'}
        onClose={() => setDompetSheet(null)}
      >
        <DompetForm
          initial={editDompet}
          onAskSelesai={
            editDompet?.jenis === 'liburan' &&
            items.some((t) => t.jenis === 'keluar' && t.dompetId === editDompet.id && !t.liburanSelesai)
              ? () => {
                  setTutupLiburan(editDompet)
                  setDompetSheet(null)
                }
              : null
          }
          alasanTerkunci={alasanTerkunci}
          onDone={() => setDompetSheet(null)}
          onAskDelete={() => {
            setHapusDompet(editDompet)
            setDompetSheet(null)
          }}
        />
      </Sheet>

      <ConfirmSheet
        open={tutupLiburan !== null}
        title="Liburan selesai?"
        message="Hitungan budget dan hari mulai dari awal. Riwayat liburan ini tetap ada, dipisah garis. Tidak bisa dibatalkan."
        confirmLabel="Ya, mulai baru"
        onClose={() => setTutupLiburan(null)}
        onConfirm={() => tutupLiburan && track(selesaiLiburan(tutupLiburan.id), 'Liburan ditutup', 'Menyimpan...')}
      />

      <ConfirmSheet
        open={deleting !== null}
        title="Hapus transaksi?"
        message={deleting ? `"${baris(deleting).judul}" (${baris(deleting).jumlah}) akan dihapus permanen.` : ''}
        confirmLabel="Hapus"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && track(deleteTransaksi(deleting.id), 'Dihapus', 'Menghapus...')}
      />

      <ConfirmSheet
        open={hapusDompet !== null}
        title="Hapus dompet?"
        message={`Dompet "${hapusDompet?.nama ?? ''}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onClose={() => setHapusDompet(null)}
        onConfirm={async () => {
          if (!hapusDompet) return
          const r = await track(deleteDompet(hapusDompet.id), 'Dompet dihapus', 'Menghapus...')
          if (r.ok) keKartu(0)
        }}
      />
    </>
  )
}
