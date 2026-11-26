'use client'

import { useMemo, useState } from 'react'
import { deleteKegiatan, markTerlaksana, reorderKegiatan } from '@/app/actions/kegiatan'
import { useDragReorder } from '@/hooks/useDragReorder'
import { useMinute } from '@/hooks/useMinute'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { angka, formatTanggal, formatTanggalPanjang, formatTanggalSingkat, nowJakarta, rupiah } from '@/lib/format'
import { mapsUrl } from '@/lib/geo'
import { kegiatanBerlangsung, moveItem } from '@/lib/schedule'
import type { Dompet, Kegiatan, TempatRingkas } from '@/lib/types'
import { useFeedback } from './Feedback'
import { KegiatanCard } from './KegiatanCard'
import { KegiatanDetail } from './KegiatanDetail'
import { KegiatanForm } from './KegiatanForm'
import { PhotoViewer } from './Photos'
import { PlaceSuggest } from './PlaceSuggest'
import { ConfirmSheet, Sheet } from './Sheet'
import { Empty, Fab, Field, inputCls, PageHeader, Pagination, SearchBox } from './ui'

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

/**
 * Isi sheet "terlaksana": tempat boleh dipilih dari Database (agar tercatat sebagai kunjungan) dan
 * pengeluarannya boleh langsung dicatat ke Uang. Keduanya opsional.
 */
function DoneBody({
  item,
  tempat,
  dompet,
  onCancel,
  onConfirm,
}: {
  item: Kegiatan
  tempat: TempatRingkas[]
  dompet: Dompet[]
  onCancel: () => void
  onConfirm: (tempatId: string | null, pengeluaran: { jumlah: number; dompetId: string } | null) => void
}) {
  const linked = tempat.find((t) => t.id === item.tempatId) ?? null
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<TempatRingkas | null>(null)
  const [digits, setDigits] = useState(item.budget > 0 ? String(item.budget) : '')
  const [dompetId, setDompetId] = useState(dompet[0]?.id ?? '')

  return (
    <div className="space-y-3">
      {linked ? (
        <p className="rounded-xl bg-done/10 px-3 py-2 text-sm text-done">
          Kunjungan ke <strong>{linked.nama}</strong> akan bertambah 1.
        </p>
      ) : (
        <PlaceSuggest
          label="Di tempat mana?"
          places={tempat}
          value={text}
          picked={picked}
          onText={(v) => {
            setText(v)
            if (picked && v !== picked.nama) setPicked(null)
          }}
          onPick={(t) => {
            setPicked(t)
            setText(t.nama)
          }}
          placeholder="Ketik nama tempat dari Database"
          maxLength={150}
        />
      )}
      {dompet.length > 0 && (
        <div>
          <Field label="Habis berapa? (Rp)">
            <input
              inputMode="numeric"
              autoComplete="off"
              value={digits ? angka(Number(digits)) : ''}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="0"
              className={inputCls}
            />
          </Field>
          <p className="mt-1 text-xs text-muted">
            Diisi = masuk ke Uang keluar. Kosongkan kalau sudah kamu catat di Uang.
          </p>
        </div>
      )}
      {Number(digits) > 0 && dompet.length > 0 && (
        <Field label="Dari dompet">
          <select required value={dompetId} onChange={(e) => setDompetId(e.target.value)} className={inputCls}>
            {dompet.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button type="button" onClick={onCancel} className="h-12 rounded-xl bg-gray-100 font-semibold">
          Batal
        </button>
        <button
          type="button"
          onClick={() =>
            onConfirm(
              linked ? null : (picked?.id ?? null),
              Number(digits) > 0 && dompetId ? { jumlah: Number(digits), dompetId } : null,
            )
          }
          className="h-12 rounded-xl bg-done font-semibold text-white"
        >
          Ya, terlaksana
        </button>
      </div>
    </div>
  )
}

export function KegiatanList({
  mode,
  items,
  today,
  tempat,
  dompet = [],
}: {
  mode: Mode
  items: Kegiatan[]
  today: string
  tempat: TempatRingkas[]
  /** Hanya Rencana: untuk mencatat pengeluaran saat menandai terlaksana. */
  dompet?: Dompet[]
}) {
  const { track } = useFeedback()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Kegiatan | null>(null)
  const [confirm, setConfirm] = useState<{ kind: 'done' | 'delete'; item: Kegiatan } | null>(null)
  const [viewer, setViewer] = useState<{ ownerId: string; index: number; back?: boolean } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

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
        // Histori: terbaru di atas. Rencana: terdekat di atas.
        .sort(
          (a, b) =>
            (mode === 'histori' ? -1 : 1) * (a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam)),
        ),
    [items, over, mode],
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

  // Kartu yang sedang berlangsung (hanya di Rencana). minute = 0 di server/hidrasi: belum ada sorotan.
  const minute = useMinute()
  const aktifId = (() => {
    if (mode !== 'rencana' || minute === 0) return null
    const now = nowJakarta(minute * 60_000)
    return kegiatanBerlangsung(merged, now.tanggal, now.menit)
  })()

  const tempatById = useMemo(() => new Map(tempat.map((t) => [t.id, t])), [tempat])

  const mapsFor = (k: Kegiatan) =>
    k.tempatId && tempatById.has(k.tempatId) ? mapsUrl(tempatById.get(k.tempatId)!) : undefined
  const detail = detailId ? (merged.find((k) => k.id === detailId) ?? null) : null

  const viewerFotos = viewer ? (merged.find((k) => k.id === viewer.ownerId)?.fotos ?? []).filter((f) => !f.pdf) : []
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
                        active={item.id === aktifId}
                        terlewat={mode === 'rencana' && item.tanggal < today}
                        mapsHref={mapsFor(item)}
                        style={isDragged ? { transform: `translateY(${dy}px)` } : undefined}
                        dragProps={mode === 'rencana' ? bind(item.id) : undefined}
                        onDone={() => setConfirm({ kind: 'done', item })}
                        onEdit={() => openForm(item)}
                        onDelete={() => setConfirm({ kind: 'delete', item })}
                        onOpenDetail={() => setDetailId(item.id)}
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
        <KegiatanForm initial={editing} today={today} tempat={tempat} onDone={() => setFormOpen(false)} />
      </Sheet>

      <Sheet open={confirm?.kind === 'done'} title="Yakin sudah terlaksana?" onClose={() => setConfirm(null)}>
        {confirm?.kind === 'done' && (
          <DoneBody
            item={confirm.item}
            tempat={tempat}
            dompet={dompet}
            onCancel={() => setConfirm(null)}
            onConfirm={(tempatId, pengeluaran) => {
              const id = confirm.item.id
              setConfirm(null)
              track(markTerlaksana(id, tempatId, pengeluaran), 'Pindah ke Histori', 'Memproses...')
            }}
          />
        )}
      </Sheet>
      <ConfirmSheet
        open={confirm?.kind === 'delete'}
        title="Hapus rencana?"
        message={`"${confirm?.item.kegiatan ?? ''}" beserta fotonya akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && track(deleteKegiatan(confirm.item.id), 'Dihapus', 'Menghapus...')}
      />

      <Sheet open={detail !== null} title={detail?.kegiatan ?? ''} onClose={() => setDetailId(null)}>
        {detail && (
          <KegiatanDetail
            item={detail}
            mapsHref={mapsFor(detail)}
            onOpenPhoto={(index) => {
              // Penampil foto layar penuh ada di bawah sheet, jadi sheet ditutup dulu dan dibuka lagi saat penampil ditutup.
              setDetailId(null)
              setViewer({ ownerId: detail.id, index, back: true })
            }}
          />
        )}
      </Sheet>

      {viewer && (
        <PhotoViewer
          fotos={viewerFotos}
          startIndex={viewer.index}
          onClose={() => {
            if (viewer.back) setDetailId(viewer.ownerId)
            setViewer(null)
          }}
        />
      )}
    </>
  )
}
