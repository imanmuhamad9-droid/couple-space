'use client'

import { ExternalLink, ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { isHttpLink } from '@/lib/geo'
import type { Tempat } from '@/lib/types'
import { UploadButton } from './Photos'

function mapsUrl(t: Tempat): string {
  if (isHttpLink(t.linkMaps)) return t.linkMaps.trim()
  const query = t.lat !== null && t.lng !== null ? `${t.lat},${t.lng}` : `${t.nama} ${t.kota}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function TempatCard({
  tempat: t,
  km,
  onEdit,
  onDelete,
  onOpenPhoto,
}: {
  tempat: Tempat
  km: number | null
  onEdit: () => void
  onDelete: () => void
  onOpenPhoto: () => void
}) {
  const first = t.fotos[0]
  return (
    <article className="flex gap-3 rounded-[14px] bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onOpenPhoto}
        disabled={!first}
        aria-label={first ? `Lihat ${t.fotos.length} foto` : 'Belum ada foto'}
        className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-200 text-gray-400"
      >
        {first ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={first.url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <ImageIcon size={28} />
        )}
        {t.fotos.length > 1 && (
          <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 text-xs text-white">
            {t.fotos.length}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold leading-snug">{t.nama}</h3>
        <p className="text-sm text-muted">
          {t.kategori} · {t.kota}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {t.buka && t.tutup ? `Buka ${t.buka} - ${t.tutup}` : 'Jam buka belum diisi'}
        </p>
        {t.lat === null || t.lng === null ? (
          <p className="text-sm text-muted">Koordinat belum ada</p>
        ) : (
          km !== null && <p className="text-sm font-medium text-upload">± {km.toFixed(1)} km dari kamu</p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <a
            href={mapsUrl(t)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-full bg-upload/10 px-3 text-sm font-medium text-upload"
          >
            <ExternalLink size={15} /> Buka di Maps
          </a>
          <span className="ml-auto flex gap-2">
            <UploadButton kind="tempat" ownerId={t.id} />
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="grid size-10 place-items-center rounded-full bg-edit/10 text-edit"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              aria-label="Hapus"
              onClick={onDelete}
              className="grid size-10 place-items-center rounded-full bg-del/10 text-del"
            >
              <Trash2 size={18} />
            </button>
          </span>
        </div>
      </div>
    </article>
  )
}
