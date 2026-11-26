'use client'

import { Check, MapPin } from 'lucide-react'
import { suggestTempat } from '@/lib/suggest'
import type { TempatRingkas } from '@/lib/types'
import { Field, InputHapus } from './ui'

/**
 * Kolom nama tempat dengan rekomendasi dari Database saat mengetik. Teks bebas tetap boleh:
 * jika tidak ada yang cocok (atau tidak dipilih), yang kamu ketik disimpan apa adanya.
 */
export function PlaceSuggest({
  label,
  places,
  value,
  picked,
  onText,
  onPick,
  placeholder,
  maxLength = 500,
}: {
  label: string
  places: TempatRingkas[]
  value: string
  /** Tempat yang sudah dipilih dari rekomendasi (null = teks bebas). */
  picked: TempatRingkas | null
  onText: (v: string) => void
  onPick: (t: TempatRingkas) => void
  placeholder?: string
  maxLength?: number
}) {
  const matches = picked || value.trim().length < 2 ? [] : suggestTempat(places, value)

  return (
    <div>
      <Field label={label}>
        <InputHapus
          value={value}
          onChange={(e) => onText(e.target.value)}
          onHapus={() => onText('')}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
        />
      </Field>

      {picked && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-done">
          <Check size={13} /> Dari Database · {picked.kategori} · {picked.kota}
        </p>
      )}

      {matches.length > 0 && (
        <div className="mt-1.5">
          <p className="mb-1 text-xs font-medium text-muted">Rekomendasi dari Database</p>
          <ul className="overflow-hidden rounded-xl border border-line bg-white">
            {matches.map((t) => (
              <li key={t.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(t)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left active:bg-gray-100"
                >
                  <MapPin size={15} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.nama}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.kategori} · {t.kota}
                      {t.kunjungan > 0 ? ` · ${t.kunjungan}× dikunjungi` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
