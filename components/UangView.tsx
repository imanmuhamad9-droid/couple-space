'use client'

import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { deleteTransaksi } from '@/app/actions/transaksi'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { formatTanggal, rupiah } from '@/lib/format'
import type { Transaksi } from '@/lib/types'
import { geser, labelPeriode, periodeDari, ringkasan } from '@/lib/uang'
import { useFeedback } from './Feedback'
import { ConfirmSheet, Sheet } from './Sheet'
import { TransaksiForm } from './TransaksiForm'
import { Empty, PageHeader, Pagination } from './ui'

const tanda = (t: Transaksi) => (t.jenis === 'masuk' ? '+' : '−')

export function UangView({ items, today }: { items: Transaksi[]; today: string }) {
  const { track } = useFeedback()
  const sekarang = periodeDari(today)
  const [per, setPer] = useState(sekarang)
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaksi | null>(null)
  const [selected, setSelected] = useState<Transaksi | null>(null)
  const [deleting, setDeleting] = useState<Transaksi | null>(null)

  // items sudah terurut terbaru di atas, jadi yang terakhir adalah yang tertua.
  const tertua = items.length ? items[items.length - 1].tanggal : today
  const bisaMundur = per.start > tertua
  const bisaMaju = per.start < sekarang.start

  const { saldo } = ringkasan(items)
  const { masuk, keluar } = ringkasan(items, per)
  const daftar = useMemo(() => items.filter((t) => t.tanggal >= per.start && t.tanggal <= per.end), [items, per])

  const pages = Math.max(1, Math.ceil(daftar.length / ITEM_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const tampil = daftar.slice(cur * ITEM_PER_HALAMAN, (cur + 1) * ITEM_PER_HALAMAN)
  const hari = [...new Set(tampil.map((t) => t.tanggal))]

  function ganti(delta: number) {
    setPer(geser(per, delta))
    setPage(0)
  }

  function buka(t: Transaksi | null) {
    setEditing(t)
    setFormOpen(true)
  }

  const nav = 'grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30'

  return (
    <>
      <PageHeader title="Uang" info="uang" />

      <section
        className={`mx-3 mb-3 rounded-2xl p-4 text-white shadow-md ${
          saldo < 0 ? 'bg-gradient-to-br from-red-700 to-red-500' : 'bg-gradient-to-br from-blue-700 to-sky-500'
        }`}
      >
        <p className="text-sm opacity-85">Uang kamu</p>
        <p className="mt-0.5 text-3xl font-bold tabular-nums">
          {saldo < 0 ? '−' : ''}
          {rupiah(Math.abs(saldo))}
        </p>
      </section>

      <div className="mx-3 mb-2 flex items-center justify-between">
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
        onClick={() => buka(null)}
        className="mx-3 mt-3 flex h-12 w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-xl bg-upload font-semibold text-white active:scale-[0.99]"
      >
        <Plus size={20} /> Tambah transaksi
      </button>

      <h2 className="mx-4 mb-1 mt-5 text-xs font-semibold text-muted">Riwayat</h2>
      {daftar.length === 0 ? (
        <Empty>Belum ada transaksi di periode ini.</Empty>
      ) : (
        hari.map((tgl) => (
          <section key={tgl} className="mx-3 mb-3">
            <h3 className="mb-1 px-1 text-xs font-semibold text-muted">{formatTanggal(tgl)}</h3>
            <div className="space-y-1.5">
              {tampil
                .filter((t) => t.tanggal === tgl)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm active:bg-gray-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{t.keterangan}</span>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${t.jenis === 'masuk' ? 'text-done' : 'text-del'}`}
                    >
                      {tanda(t)} {rupiah(t.jumlah)}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))
      )}

      <Pagination page={cur} pages={pages} onChange={setPage} />

      <Sheet open={selected !== null} title="Transaksi" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className={`text-2xl font-bold tabular-nums ${selected.jenis === 'masuk' ? 'text-done' : 'text-del'}`}>
                {tanda(selected)} {rupiah(selected.jumlah)}
              </p>
              <p className="mt-1 break-words font-medium">{selected.keterangan}</p>
              <p className="mt-0.5 text-sm text-muted">
                {selected.jenis === 'masuk' ? 'Uang masuk' : 'Uang keluar'} · {formatTanggal(selected.tanggal)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const t = selected
                  setSelected(null)
                  buka(t)
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
          onDone={(tanggal) => {
            setFormOpen(false)
            // Pindah ke periode transaksi yang baru disimpan supaya langsung terlihat.
            setPer(periodeDari(tanggal))
            setPage(0)
          }}
        />
      </Sheet>

      <ConfirmSheet
        open={deleting !== null}
        title="Hapus transaksi?"
        message={deleting ? `"${deleting.keterangan}" (${tanda(deleting)} ${rupiah(deleting.jumlah)}) akan dihapus permanen.` : ''}
        confirmLabel="Hapus"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && track(deleteTransaksi(deleting.id), 'Dihapus', 'Menghapus...')}
      />
    </>
  )
}
