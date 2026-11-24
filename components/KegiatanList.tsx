'use client'

import { useMemo, useState } from 'react'
import { deleteKegiatan, markTerlaksana, reorderKegiatan } from '@/app/actions/kegiatan'
import { useDragReorder } from '@/hooks/useDragReorder'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { formatTanggal, formatTanggalPanjang, formatTanggalSingkat, rupiah } from '@/lib/format'
import { moveItem } from '@/lib/schedule'
import type { Kegiatan } from '@/lib/types'
import { useFeedback } from './Feedback'
import { KegiatanCard } from './KegiatanCard'
import { KegiatanForm } from './KegiatanForm'
import { PhotoViewer } from './Photos'
import { ConfirmSheet, Sheet } from './Sheet'
import { Empty, Fab, PageHeader, Pagination, SearchBox } from './ui'

type Mode = 'rencana' | 'histori'
type Override = { tanggal: string; jam: string }

function haystack(k: Kegiatan) {
  return [
    k.tanggal,
    formatTanggal(k.tanggal),
    formatTanggalPanjang(k.tanggal),
    formatTanggalSingkat(k.tanggal),
    k.jam,
    k.kegiatan,
    k.lokasi,
    String(k.budget),
    k.budget > 0 ? rupiah(k.budget) : '',
    k.status,
  ]
    .join(' ')
    .toLowerCase()
}

export function KegiatanList({ mode, items, today }: { mode: Mode; items: Kegiatan[]; today: string }) {
  const { track } = useFeedback()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kegiatan | null>(null)
  const [confirm, setConfirm] = useState<{ kind: 'done' | 'delete'; item: Kegiatan } | null>(null)
  const [viewer, setViewer] = useState<{ ownerId: string; index: number } | null>(null)

  // Hasil geser ditampilkan langsung (optimistis) sampai data dari server tiba.
  const [lastItems, setLastItems] = useState(items)
  const [over, setOver] = useState<Map<string, Override>>(new Map())
  if (items !== lastItems) {
    setLastItems(items)
    setOver(new Map())
  }

  const merged = useMemo(
    () =>
      items
        .map((i) => ({ ...i, ...over.get(i.id) }))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam)),
    [items, over],
  )

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = useMemo(
    () => (words.length ? merged.filter((k) => words.every((w) => haystack(k).includes(w))) : merged),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [merged, q],
  )

  // 20 kartu per halaman; satu hari bisa terbelah di batas halaman.
  const pages = Math.max(1, Math.ceil(filtered.length / ITEM_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const pageItems = filtered.slice(cur * ITEM_PER_HALAMAN, (cur + 1) * ITEM_PER_HALAMAN)
  const visibleDays = [...new Set(pageItems.map((k) => k.tanggal))]

  const { dragId, dy, target, bind } = useDragReorder({
    enabled: mode === 'rencana' && words.length === 0,
    onDrop: async (id, day, idx) => {
      // idx dihitung di antara kartu yang tampil; tambahkan kartu hari itu yang ada di halaman sebelumnya.
      const firstShown = pageItems.find((k) => k.tanggal === day)
      const offset = firstShown ? merged.filter((k) => k.tanggal === day).findIndex((k) => k.id === firstShown.id) : 0
      const changes = moveItem(
        merged.map((k) => ({ id: k.id, tanggal: k.tanggal, jam: k.jam, done: false })),
        id,
        day,
        idx + offset,
      )
      if (changes.length === 0) return
      setOver((prev) => {
        const m = new Map(prev)
        for (const c of changes) m.set(c.id, { tanggal: c.tanggal, jam: c.jam })
        return m
      })
      const r = await track(reorderKegiatan(changes), undefined, 'Menyimpan urutan...')
      if (!r.ok) setOver(new Map())
    },
  })

  const viewerFotos = viewer ? (merged.find((k) => k.id === viewer.ownerId)?.fotos ?? []) : []
  const title = mode === 'rencana' ? 'Rencana' : 'Histori'

  function openForm(k: Kegiatan | null) {
    setEditing(k)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader title={title} info={mode} />
      <SearchBox
        value={q}
        onChange={(v) => {
          setQ(v)
          setPage(0)
        }}
        placeholder="Cari kegiatan, lokasi, tanggal..."
      />

      {filtered.length === 0 ? (
        <Empty>
          {items.length === 0
            ? mode === 'rencana'
              ? 'Belum ada rencana. Tekan + untuk menambah.'
              : 'Belum ada kegiatan yang terlaksana.'
            : 'Tidak ada yang cocok dengan pencarianmu.'}
        </Empty>
      ) : (
        visibleDays.map((day) => {
          const dayItems = pageItems.filter((k) => k.tanggal === day)
          const t = target?.day === day ? target : null
          let k = 0
          const bar = <div className="my-0.5 h-1 rounded-full bg-upload" />
          return (
            <section
              key={day}
              data-day={day}
              className={`mx-3 mb-3 rounded-xl p-1 transition-colors ${t ? 'bg-upload/10' : ''}`}
            >
              <h2 className="mb-1 px-1 text-xs font-semibold text-muted">{formatTanggal(day)}</h2>
              <div className="space-y-1.5">
                {dayItems.map((item) => {
                  const isDragged = item.id === dragId
                  const before = !isDragged && t?.idx === k ? bar : null
                  if (!isDragged) k++
                  return (
                    <div key={item.id}>
                      {before}
                      <KegiatanCard
                        item={item}
                        mode={mode}
                        dragging={isDragged}
                        style={isDragged ? { transform: `translateY(${dy}px)` } : undefined}
                        dragProps={mode === 'rencana' ? bind(item.id) : undefined}
                        onDone={() => setConfirm({ kind: 'done', item })}
                        onEdit={() => openForm(item)}
                        onDelete={() => setConfirm({ kind: 'delete', item })}
                        onOpenPhoto={(index) => setViewer({ ownerId: item.id, index })}
                      />
                    </div>
                  )
                })}
                {t && t.idx === k && bar}
              </div>
            </section>
          )
        })
      )}

      <Pagination page={cur} pages={pages} onChange={setPage} />
      {mode === 'rencana' && <Fab label="Tambah rencana" onClick={() => openForm(null)} />}

      <Sheet open={formOpen} title={editing ? 'Edit Rencana' : 'Tambah Rencana'} onClose={() => setFormOpen(false)}>
        <KegiatanForm initial={editing} today={today} onDone={() => setFormOpen(false)} />
      </Sheet>

      <ConfirmSheet
        open={confirm?.kind === 'done'}
        title="Yakin sudah terlaksana?"
        message={`"${confirm?.item.kegiatan ?? ''}" akan pindah ke Histori dan tidak bisa diedit lagi.`}
        confirmLabel="Ya, terlaksana"
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && track(markTerlaksana(confirm.item.id), 'Pindah ke Histori', 'Memproses...')}
      />
      <ConfirmSheet
        open={confirm?.kind === 'delete'}
        title="Hapus rencana?"
        message={`"${confirm?.item.kegiatan ?? ''}" beserta fotonya akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && track(deleteKegiatan(confirm.item.id), 'Dihapus', 'Menghapus...')}
      />

      {viewer && (
        <PhotoViewer fotos={viewerFotos} startIndex={viewer.index} onClose={() => setViewer(null)} />
      )}
    </>
  )
}
