'use client'

import { CheckCheck, ExternalLink, ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { mapsUrl } from '@/lib/geo'
import type { Tempat } from '@/lib/types'
import { UploadButton } from './Photos'

const icon = 'grid size-9 place-items-center rounded-full'

/** Kartu ringkas: foto kecil + info di kiri-atas, baris tombol di bawah. */
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
  const jam = t.buka && t.tutup ? `Buka ${t.buka} - ${t.tutup}` : 'Jam belum diisi'
  const jarak =
    t.lat === null || t.lng === null ? 'Koordinat belum ada' : km !== null ? `± ${km.toFixed(1)} km dari kamu` : null

  return (
    <article className="rounded-xl bg-white p-2.5 shadow-sm">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onOpenPhoto}
          disabled={!first}
          aria-label={first ? `Lihat ${t.fotos.length} foto` : 'Belum ada foto'}
          className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-200 text-gray-400"
        >
          {first ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={first.url} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <ImageIcon size={22} />
          )}
          {t.fotos.length > 1 && (
            <span className="absolute bottom-0.5 right-0.5 rounded-full bg-black/60 px-1 text-[10px] text-white">
              {t.fotos.length}
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[15px] font-semibold leading-snug">{t.nama}</h3>
          <p className="truncate text-xs text-muted">
            {t.kategori} · {t.kota}
          </p>
          <p className="truncate text-xs text-muted">{jam}</p>
          {jarak && (
            <p className={`truncate text-xs ${km !== null ? 'font-medium text-upload' : 'text-muted'}`}>{jarak}</p>
          )}
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              t.kunjungan > 0 ? 'bg-done/10 text-done' : 'bg-gray-100 text-muted'
            }`}
          >
            <CheckCheck size={13} /> {t.kunjungan > 0 ? `Dikunjungi ${t.kunjungan}×` : 'Belum dikunjungi'}
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <a
          href={mapsUrl(t)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-upload/10 px-3 text-xs font-medium text-upload"
        >
          <ExternalLink size={14} /> Buka di Maps
        </a>
        <span className="ml-auto flex gap-1.5">
          <UploadButton kind="tempat" ownerId={t.id} />
          <button type="button" aria-label="Edit" onClick={onEdit} className={`${icon} bg-edit/10 text-edit`}>
            <Pencil size={15} />
          </button>
          <button type="button" aria-label="Hapus" onClick={onDelete} className={`${icon} bg-del/10 text-del`}>
            <Trash2 size={15} />
          </button>
        </span>
      </div>
    </article>
  )
}
