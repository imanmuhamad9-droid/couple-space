'use client'

import { Check, ChevronRight, ExternalLink, MapPin, Paperclip, Pencil, Trash2 } from 'lucide-react'
import type { CSSProperties, HTMLAttributes } from 'react'
import { isHttpLink } from '@/lib/geo'
import { rupiah } from '@/lib/format'
import type { Kegiatan } from '@/lib/types'
import { UploadButton } from './Photos'

type Props = {
  item: Kegiatan
  mode: 'rencana' | 'histori'
  dragging: boolean
  /** Sedang berlangsung sekarang: kartu bergradien biru. */
  active?: boolean
  /** Jika lokasi dipilih dari Database: tautan Maps tempat itu. */
  mapsHref?: string
  style?: CSSProperties
  dragProps?: HTMLAttributes<HTMLElement>
  onDone: () => void
  onEdit: () => void
  onDelete: () => void
  /** Buka popup detail (info acara + lampiran). */
  onOpenDetail: () => void
}

const icon = 'grid size-9 place-items-center rounded-full active:scale-95'

/** Kartu ringkas: baris 1 = jam + judul; baris 2 = lokasi/budget di kiri, tombol ikon di kanan. */
export function KegiatanCard({
  item,
  mode,
  dragging,
  active = false,
  mapsHref,
  style,
  dragProps,
  onDone,
  onEdit,
  onDelete,
  onOpenDetail,
}: Props) {
  const done = item.status === 'terlaksana'
  const linkLokasi = isHttpLink(item.lokasi)
  // Tujuan Maps: tempat dari Database, atau lokasi yang isinya link. Teks lokasi biasa tetap tampil sebagai teks.
  const mapsLink = mapsHref ?? (linkLokasi ? item.lokasi.trim() : undefined)
  const textLokasi = item.lokasi !== '' && !linkLokasi
  return (
    <article
      data-card-id={item.id}
      style={style}
      {...dragProps}
      className={`rounded-xl px-2.5 py-2 transition-shadow ${
        active ? 'bg-gradient-to-br from-blue-700 via-blue-600 to-sky-400 text-white shadow-md' : 'bg-white shadow-sm'
      } ${mode === 'rencana' ? 'select-none [-webkit-touch-callout:none]' : ''} ${
        dragging ? 'relative z-20 scale-[1.02] shadow-2xl' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-px shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
            active ? 'bg-white/20' : 'bg-gray-100'
          }`}
        >
          {item.jam}
        </span>
        <h3
          className={`min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug ${
            done ? 'text-muted line-through' : ''
          }`}
        >
          {item.kegiatan}
        </h3>
        {active && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-white" />
            Sekarang
          </span>
        )}
        {done && (
          <span className="shrink-0 rounded-full bg-done/10 px-2 py-0.5 text-[11px] font-semibold text-done">
            Terlaksana
          </span>
        )}
      </div>

      {(textLokasi || item.budget > 0) && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${active ? 'text-white/90' : 'text-muted'}`}>
          {textLokasi && (
            <>
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{item.lokasi}</span>
            </>
          )}
          {textLokasi && item.budget > 0 && <span aria-hidden="true">·</span>}
          {item.budget > 0 && <span className="shrink-0">{rupiah(item.budget)}</span>}
        </p>
      )}

      <div className="mt-1.5 flex items-center gap-1.5">
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-xs font-medium ${
              active ? 'bg-white/20 text-white' : 'bg-upload/10 text-upload'
            }`}
          >
            <ExternalLink size={14} /> Buka di Maps
          </a>
        )}

        <div className="ml-auto flex shrink-0 gap-1.5">
          <UploadButton kind="kegiatan" ownerId={item.id} light={active} allowPdf />
          {mode === 'rencana' && (
            <>
              <button
                type="button"
                aria-label="Tandai terlaksana"
                onClick={onDone}
                className={`${icon} bg-done text-white`}
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                type="button"
                aria-label="Edit"
                onClick={onEdit}
                className={`${icon} ${active ? 'bg-white/20 text-white' : 'bg-edit/10 text-edit'}`}
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                aria-label="Hapus"
                onClick={onDelete}
                className={`${icon} ${active ? 'bg-white/20 text-white' : 'bg-del/10 text-del'}`}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {item.fotos.length > 0 && (
        <button
          type="button"
          onClick={onOpenDetail}
          className={`mt-1.5 flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-xs font-medium active:opacity-80 ${
            active ? 'bg-white/20 text-white' : 'bg-gray-100 text-ink'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Paperclip size={14} /> {item.fotos.length} lampiran
          </span>
          <span className="flex items-center gap-0.5 opacity-70">
            Lihat detail <ChevronRight size={14} />
          </span>
        </button>
      )}
    </article>
  )
}
