'use client'

import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, RefreshCw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { KETERANGAN } from '@/lib/constants'
import { formatTanggalRingkas } from '@/lib/format'
import { Sheet } from './Sheet'

export function PageHeader({
  title,
  info,
  right,
}: {
  title: string
  info: keyof typeof KETERANGAN
  right?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  return (
    <header className="flex items-center justify-between px-4 pb-3 pt-[calc(20px+env(safe-area-inset-top))]">
      <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
      <div className="flex items-center gap-2">
        {right}
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          aria-label="Muat ulang data"
          className="grid size-8 place-items-center rounded-full bg-gray-200 text-muted"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Keterangan ${title}`}
          className="grid size-8 place-items-center rounded-full bg-gray-200 text-sm font-bold text-muted"
        >
          !
        </button>
      </div>
      <Sheet open={open} title={`Keterangan ${title}`} onClose={() => setOpen(false)}>
        <ul className="list-disc space-y-2 pl-5 text-ink">
          {KETERANGAN[info].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Sheet>
    </header>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mx-4 mb-3">
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-base outline-none focus:border-upload"
      />
    </div>
  )
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (p: number) => void
}) {
  if (pages <= 1) return null
  const btn = 'grid size-10 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30'
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button type="button" aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => onChange(page - 1)} className={btn}>
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm text-muted">
        {page + 1} / {pages}
      </span>
      <button type="button" aria-label="Halaman berikutnya" disabled={page >= pages - 1} onClick={() => onChange(page + 1)} className={btn}>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[430px] justify-end px-4">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="pointer-events-auto grid size-14 place-items-center rounded-full bg-upload text-white shadow-lg active:scale-95"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-12 text-center text-muted">{children}</p>
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${active ? 'bg-upload text-white' : 'bg-white text-muted shadow-sm'}`}
    >
      {children}
    </button>
  )
}

export const inputCls =
  'block h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-white px-3 text-base outline-none focus:border-upload'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-11 w-full rounded-xl bg-upload font-semibold text-white disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/**
 * Pemilih tanggal/jam. Safari iOS tidak mau mengecilkan <input type=date|time> (lebarnya
 * melar dan teksnya miring), jadi kotak yang terlihat dibuat sendiri, sedangkan input asli
 * ditaruh transparan di atasnya agar pemilih bawaan iPhone tetap terbuka saat ditekan.
 */
export function PickerField({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string
  type: 'date' | 'time'
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const Icon = type === 'date' ? CalendarDays : Clock
  const shown = value ? (type === 'date' ? formatTanggalRingkas(value) : value) : type === 'date' ? 'Pilih tanggal' : '--:--'
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <span className="relative flex h-11 w-full items-center justify-between overflow-hidden rounded-xl border border-line bg-white px-3 focus-within:border-upload">
        <span className={`truncate text-base ${value ? '' : 'text-gray-400'}`}>{shown}</span>
        <Icon size={18} className="shrink-0 text-muted" />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="absolute inset-0 size-full min-w-0 cursor-pointer opacity-0"
        />
      </span>
    </label>
  )
}
