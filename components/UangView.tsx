'use client'

import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type UIEvent } from 'react'
import { deleteDompet, saveDompet, urutkanDompet } from '@/app/actions/dompet'
import { deleteTransaksi } from '@/app/actions/transaksi'
import { useHorizontalReorder } from '@/hooks/useHorizontalReorder'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { formatTanggal, rupiah } from '@/lib/format'
import type { Dompet, Transaksi } from '@/lib/types'
import { geser, labelPeriode, milikDompet, periodeDari, ringkasan } from '@/lib/uang'
import { pindahUrut } from '@/lib/urut'
import { useFeedback } from './Feedback'
import { ConfirmSheet, Sheet } from './Sheet'
import { TransaksiForm } from './TransaksiForm'
import { Empty, Field, inputCls, PageHeader, Pagination, SubmitButton } from './ui'

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

/** Isi sheet tambah/ganti nama dompet. */
function DompetForm({
  initial,
  onDone,
  onAskDelete,
  alasanTerkunci,
}: {
  initial: Dompet | null
  onDone: () => void
  onAskDelete: () => void
  /** Alasan dompet tidak bisa dihapus (null = boleh). */
  alasanTerkunci: string | null
}) {
  const { track } = useFeedback()
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(saveDompet({ id: initial?.id, nama }), 'Tersimpan')
    setBusy(false)
    if (r.ok) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nama dompet">
        <input
          required
          maxLength={40}
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Dana darurat"
          className={inputCls}
        />
      </Field>
      <SubmitButton busy={busy}>{initial ? 'Simpan nama' : 'Tambah dompet'}</SubmitButton>
      {initial && (
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
  const [idx, setIdx] = useState(0) // kartu yang sedang terlihat; 0 = dompet pertama (Bulanan)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaksi | null>(null)
  const [selected, setSelected] = useState<Transaksi | null>(null)
  const [deleting, setDeleting] = useState<Transaksi | null>(null)
  const [dompetSheet, setDompetSheet] = useState<{ edit: Dompet | null } | null>(null)
  const [hapusDompet, setHapusDompet] = useState<Dompet | null>(null)
  const rail = useRef<HTMLDivElement>(null)

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
  const daftar = items.filter((t) => milikDompet(t, aktifId) && t.tanggal >= per.start && t.tanggal <= per.end)

  const pages = Math.max(1, Math.ceil(daftar.length / ITEM_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const tampil = daftar.slice(cur * ITEM_PER_HALAMAN, (cur + 1) * ITEM_PER_HALAMAN)
  const hari = [...new Set(tampil.map((t) => t.tanggal))]

  function ganti(delta: number) {
    setPer(geser(per, delta))
    setPage(0)
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
      sub: aktifId === null ? (nama.get(t.dompetId) ?? null) : null,
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
  const lebarKartu = kompak ? 'w-[42%]' : 'w-[86%]'

  return (
    <>
      <PageHeader title="Uang" info="uang" />

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
          const warna =
            k.id === SEMUA
              ? 'from-slate-800 to-slate-600'
              : saldo < 0
                ? 'from-red-700 to-red-500'
                : WARNA[i % WARNA.length]
          const digeser = k.id === dragId

          return (
            <section
              key={k.id}
              data-wallet-id={k.dompet ? k.id : undefined}
              {...(k.dompet ? bind(k.id) : {})}
              style={digeser ? { transform: `translateX(${dx}px) scale(1.05)` } : undefined}
              className={`relative ${lebarKartu} shrink-0 snap-center select-none rounded-2xl bg-gradient-to-br p-4 text-white [-webkit-touch-callout:none] ${warna} ${
                digeser ? 'z-20 shadow-2xl' : 'shadow-md'
              }`}
            >
              <p className="truncate text-sm opacity-85">{k.dompet ? k.dompet.nama : 'Keseluruhan'}</p>
              <p className={`mt-0.5 truncate font-bold tabular-nums ${kompak ? 'text-lg' : 'text-3xl'}`}>
                {saldo < 0 ? '−' : ''}
                {rupiah(Math.abs(saldo))}
              </p>
              {!kompak && <p className="mt-1 text-xs opacity-75">{k.dompet ? 'Saldo dompet' : 'Total semua dompet'}</p>}
              {k.dompet && !kompak && (
                <button
                  type="button"
                  onClick={() => setDompetSheet({ edit: k.dompet })}
                  aria-label={`Ubah dompet ${k.dompet.nama}`}
                  className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/20 active:bg-white/30"
                >
                  <Pencil size={14} />
                </button>
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

      <div className="mx-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowDownLeft size={14} className="text-done" /> Uang masuk
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-done">+ {rupiah(masuk)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-muted">
            <ArrowUpRight size={14} className="text-del" /> Uang keluar
          </p>
          <p className="mt-0.5 truncate text-base font-bold tabular-nums text-del">− {rupiah(keluar)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => bukaForm(null)}
        className="mx-3 mt-3 flex h-12 w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-xl bg-upload font-semibold text-white active:scale-[0.99]"
      >
        <Plus size={20} /> Tambah transaksi
      </button>

      <h2 className="mx-4 mb-1 mt-5 text-xs font-semibold text-muted">{judulRiwayat}</h2>
      {daftar.length === 0 ? (
        <Empty>Belum ada transaksi di periode ini.</Empty>
      ) : (
        hari.map((tgl) => (
          <section key={tgl} className="mx-3 mb-3">
            <h3 className="mb-1 px-1 text-xs font-semibold text-muted">{formatTanggal(tgl)}</h3>
            <div className="space-y-1.5">
              {tampil
                .filter((t) => t.tanggal === tgl)
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

      <Sheet open={selected !== null} title="Transaksi" onClose={() => setSelected(null)}>
        {selected && detail && (
          <div className="space-y-4">
            <div>
              <p className={`text-2xl font-bold tabular-nums ${detail.warna}`}>
                {selected.jenis === 'pindah' ? rupiah(selected.jumlah) : detail.jumlah}
              </p>
              <p className="mt-1 break-words font-medium">
                {selected.jenis === 'pindah'
                  ? `${nama.get(selected.dompetId) ?? '?'} → ${nama.get(selected.tujuanId ?? '') ?? '?'}`
                  : selected.keterangan}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {selected.jenis === 'masuk' ? 'Uang masuk' : selected.jenis === 'keluar' ? 'Uang keluar' : 'Pindah dana'}
                {selected.jenis !== 'pindah' && ` · ${nama.get(selected.dompetId) ?? '?'}`} · {formatTanggal(selected.tanggal)}
              </p>
              {selected.jenis === 'pindah' && selected.keterangan !== 'Pindah dana' && (
                <p className="mt-1 break-words text-sm text-muted">{selected.keterangan}</p>
              )}
            </div>
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
          </div>
        )}
      </Sheet>

      <Sheet open={formOpen} title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={() => setFormOpen(false)}>
        <TransaksiForm
          initial={editing}
          today={today}
          dompet={dompetUrut}
          dompetAwal={aktifId ?? dompetUrut[0]?.id ?? ''}
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
        title={editDompet ? 'Ubah Dompet' : 'Tambah Dompet'}
        onClose={() => setDompetSheet(null)}
      >
        <DompetForm
          initial={editDompet}
          alasanTerkunci={alasanTerkunci}
          onDone={() => setDompetSheet(null)}
          onAskDelete={() => {
            setHapusDompet(editDompet)
            setDompetSheet(null)
          }}
        />
      </Sheet>

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
