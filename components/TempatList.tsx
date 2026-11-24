'use client'

import { ArrowUpDown, Check, LocateFixed, Map as MapIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { deleteTempat } from '@/app/actions/tempat'
import { useLocation } from '@/hooks/useLocation'
import { KATEGORI, KOTA, TEMPAT_PER_HALAMAN } from '@/lib/constants'
import { haversineKm } from '@/lib/geo'
import type { Tempat } from '@/lib/types'
import { useFeedback } from './Feedback'
import { PhotoViewer } from './Photos'
import { ConfirmSheet, Sheet } from './Sheet'
import { TempatCard } from './TempatCard'
import { TempatForm } from './TempatForm'
import { Chip, Empty, Fab, Field, inputCls, PageHeader, Pagination, SearchBox, SubmitButton } from './ui'

// Leaflet butuh browser, jadi dimuat hanya saat peta dibuka.
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 grid place-items-center bg-gray-200 text-muted">Memuat peta...</div>,
})

type Urut = 'nama' | 'baru' | 'dekat' | 'sering'

const URUTAN: { id: Urut; label: string; hint: string }[] = [
  { id: 'nama', label: 'Nama A-Z', hint: 'Urut abjad' },
  { id: 'baru', label: 'Baru ditambahkan', hint: 'Yang terakhir kamu tambah di atas' },
  { id: 'dekat', label: 'Terdekat', hint: 'Dari posisimu sekarang' },
  { id: 'sering', label: 'Paling sering dikunjungi', hint: 'Berdasarkan hitungan kunjungan' },
]

export function TempatList({ items }: { items: Tempat[] }) {
  const { track, toast } = useFeedback()
  const { me, locating, locate, setManual } = useLocation()
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState('')
  const [kota, setKota] = useState('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tempat | null>(null)
  const [deleting, setDeleting] = useState<Tempat | null>(null)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualText, setManualText] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [urut, setUrut] = useState<Urut>('nama')
  const [urutOpen, setUrutOpen] = useState(false)

  // Chip hanya tampil untuk nilai yang punya data; urutan mengikuti daftar tetap.
  const kategoriAda = KATEGORI.filter((k) => items.some((t) => t.kategori === k))
  const kotaCount = new Map<string, number>()
  for (const t of items) kotaCount.set(t.kota, (kotaCount.get(t.kota) ?? 0) + 1)
  const kotaAda = KOTA.filter((k) => kotaCount.has(k))

  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const list = items
      .filter((t) => (!kategori || t.kategori === kategori) && (!kota || t.kota === kota))
      .filter((t) => {
        const h = `${t.nama} ${t.kategori} ${t.kota}`.toLowerCase()
        return words.every((w) => h.includes(w))
      })
      .map((t) => ({
        t,
        km: me && t.lat !== null && t.lng !== null ? haversineKm(me, { lat: t.lat, lng: t.lng }) : null,
      }))
    const byNama = (a: (typeof list)[number], b: (typeof list)[number]) => a.t.nama.localeCompare(b.t.nama, 'id')
    list.sort((a, b) => {
      if (urut === 'dekat' && me) return (a.km ?? Infinity) - (b.km ?? Infinity) || byNama(a, b)
      if (urut === 'baru') return b.t.createdAt.localeCompare(a.t.createdAt) || byNama(a, b)
      if (urut === 'sering') return b.t.kunjungan - a.t.kunjungan || byNama(a, b)
      return byNama(a, b)
    })
    return list
  }, [items, q, kategori, kota, me, urut])

  const pages = Math.max(1, Math.ceil(rows.length / TEMPAT_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const visible = rows.slice(cur * TEMPAT_PER_HALAMAN, (cur + 1) * TEMPAT_PER_HALAMAN)
  const viewerFotos = viewerId ? (items.find((t) => t.id === viewerId)?.fotos ?? []) : []

  function openForm(t: Tempat | null) {
    setEditing(t)
    setFormOpen(true)
  }

  async function onLocate() {
    const ok = await locate()
    if (ok) toast('Lokasi ditemukan')
    else setManualOpen(true)
  }

  const reset = () => setPage(0)

  async function pilihUrut(u: Urut) {
    setUrutOpen(false)
    setUrut(u)
    reset()
    if (u === 'dekat' && !me) await onLocate() // butuh posisi; jika GPS gagal, isian manual terbuka
  }

  return (
    <>
      <PageHeader
        title="Database"
        info="database"
        right={
          <>
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              aria-label="Buka peta"
              className="grid size-8 place-items-center rounded-full bg-gray-200 text-muted"
            >
              <MapIcon size={17} />
            </button>
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              aria-label="Ambil lokasi saya"
              className={`grid size-8 place-items-center rounded-full ${me ? 'bg-upload text-white' : 'bg-gray-200 text-muted'} ${locating ? 'animate-pulse' : ''}`}
            >
              <LocateFixed size={17} />
            </button>
          </>
        }
      />
      <SearchBox
        value={q}
        onChange={(v) => {
          setQ(v)
          reset()
        }}
        placeholder="Cari nama, kategori, kota..."
        right={
          <button
            type="button"
            onClick={() => setUrutOpen(true)}
            aria-label="Urutkan"
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
              urut === 'nama' ? 'border-line bg-white text-muted' : 'border-upload bg-upload/10 text-upload'
            }`}
          >
            <ArrowUpDown size={16} /> Urutkan
          </button>
        }
      />

      {kategoriAda.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={kategori === ''} onClick={() => (setKategori(''), reset())}>
            Semua
          </Chip>
          {kategoriAda.map((k) => (
            <Chip key={k} active={kategori === k} onClick={() => (setKategori(k), reset())}>
              {k}
            </Chip>
          ))}
        </div>
      )}
      {kotaAda.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip active={kota === ''} onClick={() => (setKota(''), reset())}>
            Semua
          </Chip>
          {kotaAda.map((k) => (
            <Chip key={k} active={kota === k} onClick={() => (setKota(k), reset())}>
              {k} ({kotaCount.get(k)})
            </Chip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <Empty>{items.length === 0 ? 'Belum ada tempat. Tekan + untuk menambah.' : 'Tidak ada yang cocok.'}</Empty>
      ) : (
        <div className="space-y-1.5 px-3">
          {visible.map(({ t, km }) => (
            <TempatCard
              key={t.id}
              tempat={t}
              km={km}
              onEdit={() => openForm(t)}
              onDelete={() => setDeleting(t)}
              onOpenPhoto={() => setViewerId(t.id)}
            />
          ))}
        </div>
      )}

      <Pagination page={cur} pages={pages} onChange={setPage} />
      <Fab label="Tambah tempat" onClick={() => openForm(null)} />

      <Sheet open={formOpen} title={editing ? 'Edit Tempat' : 'Tambah Tempat'} onClose={() => setFormOpen(false)}>
        <TempatForm initial={editing} onDone={() => setFormOpen(false)} />
      </Sheet>

      <ConfirmSheet
        open={deleting !== null}
        title="Hapus tempat?"
        message={`"${deleting?.nama ?? ''}" beserta fotonya akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && track(deleteTempat(deleting.id), 'Dihapus', 'Menghapus...')}
      />

      <Sheet open={urutOpen} title="Urutkan" onClose={() => setUrutOpen(false)}>
        <ul className="space-y-1">
          {URUTAN.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => pilihUrut(o.id)}
                aria-pressed={urut === o.id}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${
                  urut === o.id ? 'bg-upload/10' : 'active:bg-gray-100'
                }`}
              >
                <span>
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </span>
                {urut === o.id && <Check size={18} className="text-upload" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={manualOpen} title="Isi lokasi kamu" onClose={() => setManualOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (setManual(manualText)) {
              setManualOpen(false)
              toast('Lokasi tersimpan')
            } else {
              toast('Koordinat tidak terbaca')
            }
          }}
          className="space-y-3"
        >
          <p className="text-sm text-muted">
            GPS tidak bisa dipakai. Tempel koordinat (contoh: -6.2088, 106.8456) atau link Google Maps yang berisi
            koordinat.
          </p>
          <Field label="Koordinat atau link Maps">
            <input
              required
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className={inputCls}
            />
          </Field>
          <SubmitButton busy={false}>Simpan lokasi</SubmitButton>
        </form>
      </Sheet>

      {mapOpen && (
        <MapView
          places={rows.map(({ t, km }) => ({ tempat: t, km }))}
          me={me}
          onLocate={onLocate}
          onClose={() => setMapOpen(false)}
        />
      )}

      {viewerId && <PhotoViewer fotos={viewerFotos} startIndex={0} onClose={() => setViewerId(null)} />}
    </>
  )
}
