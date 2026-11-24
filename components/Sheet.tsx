'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode }

/** Bottom sheet: naik dari bawah, lebar maks 430 px, tinggi maks 88 vh. */
export function Sheet({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in flex max-h-[88vh] w-full max-w-[430px] flex-col rounded-t-3xl bg-white"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid size-9 place-items-center rounded-full bg-gray-100 text-muted"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-1">{children}</div>
      </div>
    </div>
  )
}

type ConfirmProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmSheet({ open, title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmProps) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <p className="text-muted">{message}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-12 rounded-xl bg-gray-100 font-semibold">
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            onClose()
            onConfirm()
          }}
          className={`h-12 rounded-xl font-semibold text-white ${danger ? 'bg-del' : 'bg-done'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
