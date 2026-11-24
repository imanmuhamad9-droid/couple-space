'use client'

import { Check, MapPin, Pencil, Trash2, Wallet } from 'lucide-react'
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

export function KegiatanCard({ item, mode, dragging, style, dragProps, onDone, onEdit, onDelete, onOpenPhoto }: Props) {
  const done = item.status === 'terlaksana'
  return (
    <article
      data-card-id={item.id}
      style={style}
      {...dragProps}
      className={`rounded-[14px] bg-white p-4 shadow-sm transition-shadow ${
        mode === 'rencana' ? 'select-none [-webkit-touch-callout:none]' : ''
      } ${dragging ? 'relative z-20 scale-[1.02] shadow-2xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-sm font-semibold tabular-nums">
          {item.jam}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`break-words font-semibold leading-snug ${done ? 'text-muted line-through' : ''}`}>
            {item.kegiatan}
          </h3>
          {done && (
            <span className="mt-1 inline-block rounded-full bg-done/10 px-2 py-0.5 text-xs font-semibold text-done">
              Terlaksana
            </span>
          )}
          {item.lokasi &&
            (isHttpLink(item.lokasi) ? (
              <a
                href={item.lokasi}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-upload"
              >
                <MapPin size={15} /> Buka di Maps
              </a>
            ) : (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span className="break-words">{item.lokasi}</span>
              </p>
            ))}
          {item.budget > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Wallet size={15} /> {rupiah(item.budget)}
            </p>
          )}
        </div>
      </div>

      <Thumbs fotos={item.fotos} onOpen={onOpenPhoto} />

      <div className="mt-3 flex justify-end gap-2">
        <UploadButton kind="kegiatan" ownerId={item.id} />
        {mode === 'rencana' && (
          <>
            <button
              type="button"
              aria-label="Tandai terlaksana"
              onClick={onDone}
              className="grid size-10 place-items-center rounded-full border-2 border-done text-done active:scale-95"
            >
              <Check size={19} strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="grid size-10 place-items-center rounded-full bg-edit/10 text-edit active:scale-95"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              aria-label="Hapus"
              onClick={onDelete}
              className="grid size-10 place-items-center rounded-full bg-del/10 text-del active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </article>
  )
}
