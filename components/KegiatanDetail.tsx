'use client'

import { CalendarDays, MapPin, Paperclip, Wallet } from 'lucide-react'
import { isHttpLink } from '@/lib/geo'
import { formatTanggal, rupiah } from '@/lib/format'
import type { Kegiatan } from '@/lib/types'
import { PdfList, PhotoGrid } from './Photos'

/** Isi popup detail kegiatan: info acara, lalu semua lampirannya (foto dan PDF). */
export function KegiatanDetail({
  item,
  mapsHref,
  onOpenPhoto,
}: {
  item: Kegiatan
  /** Tautan Maps jika lokasi dipilih dari Database. */
  mapsHref?: string
  onOpenPhoto: (index: number) => void
}) {
  const done = item.status === 'terlaksana'
  const row = 'flex items-start gap-2.5 text-sm'
  const ic = 'mt-0.5 shrink-0 text-muted'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {done && (
          <span className="inline-block rounded-full bg-done/10 px-2.5 py-0.5 text-xs font-semibold text-done">
            Terlaksana
          </span>
        )}
        <p className={row}>
          <CalendarDays size={16} className={ic} />
          <span>
            {formatTanggal(item.tanggal)} · <strong className="tabular-nums">{item.jam}</strong>
          </span>
        </p>
        {item.lokasi && (
          <p className={row}>
            <MapPin size={16} className={ic} />
            {mapsHref || isHttpLink(item.lokasi) ? (
              <a
                href={mapsHref ?? item.lokasi}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 break-words font-medium text-upload"
              >
                {mapsHref ? item.lokasi : 'Buka di Maps'}
              </a>
            ) : (
              <span className="min-w-0 break-words">{item.lokasi}</span>
            )}
          </p>
        )}
        {item.budget > 0 && (
          <p className={row}>
            <Wallet size={16} className={ic} />
            <span>{rupiah(item.budget)}</span>
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Paperclip size={15} /> Lampiran ({item.fotos.length})
        </h3>
        {item.fotos.length === 0 ? (
          <p className="text-sm text-muted">Belum ada lampiran.</p>
        ) : (
          <>
            <PhotoGrid fotos={item.fotos} onOpen={onOpenPhoto} />
            <PdfList fotos={item.fotos} />
          </>
        )}
      </div>
    </div>
  )
}
