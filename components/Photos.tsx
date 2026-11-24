'use client'

import { ChevronLeft, ChevronRight, Download, FileText, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { deleteFoto } from '@/app/actions/foto'
import { useUpload } from '@/hooks/useUpload'
import type { FotoItem } from '@/lib/types'
import { useFeedback } from './Feedback'
import { ConfirmSheet } from './Sheet'

/** Barisan thumbnail foto (maks 4 + "+N"). PDF tidak dihitung di sini; lihat PdfList. `onOpen` memakai indeks di antara foto saja. */
export function Thumbs({ fotos, max = 4, onOpen }: { fotos: FotoItem[]; max?: number; onOpen: (i: number) => void }) {
  const images = fotos.filter((f) => !f.pdf)
  if (images.length === 0) return null
  const shown = images.slice(0, max)
  const extra = images.length - shown.length
  return (
    <div className="mt-1.5 flex gap-1.5">
      {shown.map((f, i) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Buka foto ${i + 1}`}
          className="relative size-11 shrink-0 overflow-hidden rounded-md bg-gray-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
          {extra > 0 && i === shown.length - 1 && (
            <span className="absolute inset-0 grid place-items-center bg-black/55 text-xs font-semibold text-white">
              +{extra}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Lampiran PDF: ketuk untuk membuka langsung di penampil PDF browser (tanpa mengunduh), tombol sampah untuk menghapus. */
export function PdfList({ fotos }: { fotos: FotoItem[] }) {
  const { track } = useFeedback()
  const [del, setDel] = useState<FotoItem | null>(null)
  const pdfs = fotos.filter((f) => f.pdf)
  if (pdfs.length === 0) return null
  return (
    <div className="mt-1.5 space-y-1">
      {pdfs.map((f) => (
        <div key={f.id} className="flex items-center gap-1 rounded-lg bg-gray-100 py-0.5 pl-2 pr-0.5 text-ink">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-xs font-medium"
          >
            <FileText size={15} className="shrink-0 text-del" />
            <span className="truncate">{f.nama ?? 'Dokumen PDF'}</span>
          </a>
          <button
            type="button"
            onClick={() => setDel(f)}
            aria-label={`Hapus ${f.nama ?? 'PDF'}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-del active:bg-white"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <ConfirmSheet
        open={del !== null}
        title="Hapus PDF?"
        message={`"${del?.nama ?? 'Dokumen PDF'}" akan dihapus permanen.`}
        confirmLabel="Hapus"
        danger
        onClose={() => setDel(null)}
        onConfirm={() => del && track(deleteFoto(del.id), 'PDF dihapus', 'Menghapus file...')}
      />
    </div>
  )
}

/** Ikon folder biru dengan panah unggah (dua nada biru, badan terang). */
function UploadFolderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="#0a4aa6"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 13a3 3 0 0 1 3-3h10.5l4 3.5H42a3 3 0 0 1 3 3V18H5v-5Z" fill="#4c8ff5" />
      <rect x="3" y="15.5" width="42" height="27" rx="3.5" fill="#f4f5f7" />
      <circle cx="24" cy="28.5" r="9" fill="#4c8ff5" />
      <path d="M24 22.5 18.5 28.5h3.3V34h4.4v-5.5h3.3L24 22.5Z" fill="#f4f5f7" />
      <path d="M8 39h6.5M18 39h.1" />
    </svg>
  )
}

/** Tombol ikon biru: pilih foto (dikecilkan dulu) atau PDF, lalu upload. */
export function UploadButton({
  kind,
  ownerId,
  light = false,
  allowPdf = false,
}: {
  kind: 'kegiatan' | 'tempat'
  ownerId: string
  /** Gaya terang untuk kartu bergradien. */
  light?: boolean
  /** Izinkan PDF (hanya untuk kegiatan). */
  allowPdf?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUpload()
  return (
    <>
      <button
        type="button"
        aria-label={allowPdf ? 'Upload foto atau PDF' : 'Upload foto'}
        onClick={() => input.current?.click()}
        className={`grid size-9 place-items-center rounded-lg active:scale-95 ${light ? 'bg-white/90' : ''}`}
      >
        <UploadFolderIcon className="size-8" />
      </button>
      <input
        ref={input}
        type="file"
        accept={allowPdf ? 'image/*,application/pdf' : 'image/*'}
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) await upload(kind, ownerId, files)
        }}
      />
    </>
  )
}

/** Viewer layar penuh: geser ke samping, hapus (dengan konfirmasi), unduh. */
export function PhotoViewer({
  fotos,
  startIndex,
  onClose,
}: {
  fotos: FotoItem[]
  startIndex: number
  onClose: () => void
}) {
  const { track } = useFeedback()
  const row = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(startIndex)
  const [confirm, setConfirm] = useState(false)
  const last = fotos.length - 1

  const goTo = (i: number, smooth = true) => {
    const el = row.current
    if (!el) return
    el.scrollTo({ left: Math.max(0, Math.min(i, last)) * el.clientWidth, behavior: smooth ? 'smooth' : 'instant' })
  }

  useEffect(() => {
    if (fotos.length === 0) onClose()
  }, [fotos.length, onClose])

  // posisi awal; juga merapikan posisi setelah satu foto dihapus
  useEffect(() => {
    goTo(Math.min(index, last), false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotos.length])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirm) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, confirm, onClose, fotos.length])

  if (fotos.length === 0) return null
  const current = fotos[Math.min(index, last)]
  const arrow =
    'absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white md:grid'

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
          {Math.min(index, last) + 1} / {fotos.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-10 place-items-center rounded-full bg-white/15">
          <X size={22} />
        </button>
      </div>

      <div
        ref={row}
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {fotos.map((f) => (
          <div key={f.id} className="grid h-full w-full shrink-0 snap-center place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>

      {index > 0 && (
        <button type="button" aria-label="Foto sebelumnya" onClick={() => goTo(index - 1)} className={`${arrow} left-3`}>
          <ChevronLeft size={24} />
        </button>
      )}
      {index < last && (
        <button type="button" aria-label="Foto berikutnya" onClick={() => goTo(index + 1)} className={`${arrow} right-3`}>
          <ChevronRight size={24} />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => window.open(current.url, '_blank', 'noopener,noreferrer')}
          className="flex h-11 items-center gap-2 rounded-full bg-white/15 px-5 text-sm font-medium text-white"
        >
          <Download size={18} /> Unduh
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-del px-5 text-sm font-medium text-white"
        >
          <Trash2 size={18} /> Hapus
        </button>
      </div>

      <ConfirmSheet
        open={confirm}
        title="Hapus foto?"
        message="Foto ini akan dihapus permanen."
        confirmLabel="Hapus"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await track(deleteFoto(current.id), 'Foto dihapus', 'Menghapus foto...')
        }}
      />
    </div>
  )
}
