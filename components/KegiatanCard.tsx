'use client'

import { Check, MapPin, Pencil, Trash2 } from 'lucide-react'
import type { CSSProperties, HTMLAttributes } from 'react'
import { isHttpLink } from '@/lib/geo'
import { rupiah } from '@/lib/format'
import type { Kegiatan } from '@/lib/types'
import { Thumbs, UploadButton } from './Photos'

type Props = {
  item: Kegiatan
  mode: 'rencana' | 'histori'
  dragging: boolean
  style?: CSSProperties
  dragProps?: HTMLAttributes<HTMLElement>
  onDone: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenPhoto: (index: number) => void
}

const icon = 'grid size-9 place-items-center rounded-full active:scale-95'

/** Kartu ringkas: baris 1 = jam + judul; baris 2 = lokasi/budget di kiri, tombol ikon di kanan. */
export function KegiatanCard({ item, mode, dragging, style, dragProps, onDone, onEdit, onDelete, onOpenPhoto }: Props) {
  const done = item.status === 'terlaksana'
  const linkLokasi = isHttpLink(item.lokasi)
  return (
    <article
      data-card-id={item.id}
      style={style}
      {...dragProps}
      className={`rounded-xl bg-white px-2.5 py-2 shadow-sm transition-shadow ${
        mode === 'rencana' ? 'select-none [-webkit-touch-callout:none]' : ''
      } ${dragging ? 'relative z-20 scale-[1.02] shadow-2xl' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold tabular-nums">
          {item.jam}
        </span>
        <h3 className={`min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug ${done ? 'text-muted line-through' : ''}`}>
          {item.kegiatan}
        </h3>
        {done && (
          <span className="shrink-0 rounded-full bg-done/10 px-2 py-0.5 text-[11px] font-semibold text-done">
            Terlaksana
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <div className="min-w-0 flex-1 space-y-0.5 text-xs text-muted">
          {item.lokasi &&
            (linkLokasi ? (
              <a
                href={item.lokasi}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-upload"
              >
                <MapPin size={13} className="shrink-0" /> Buka di Maps
              </a>
            ) : (
              <p className="flex items-center gap-1">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">{item.lokasi}</span>
              </p>
            ))}
          {item.budget > 0 && <p className="truncate">{rupiah(item.budget)}</p>}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <UploadButton kind="kegiatan" ownerId={item.id} />
          {mode === 'rencana' && (
            <>
              <button
                type="button"
                aria-label="Tandai terlaksana"
                onClick={onDone}
                className={`${icon} border-2 border-done text-done`}
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button type="button" aria-label="Edit" onClick={onEdit} className={`${icon} bg-edit/10 text-edit`}>
                <Pencil size={15} />
              </button>
              <button type="button" aria-label="Hapus" onClick={onDelete} className={`${icon} bg-del/10 text-del`}>
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      <Thumbs fotos={item.fotos} onOpen={onOpenPhoto} />
    </article>
  )
}
