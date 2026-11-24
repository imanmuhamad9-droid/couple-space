'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Result } from '@/lib/types'

export type Progress = { label: string; pct: number }

type Ctx = {
  toast: (msg: string) => void
  /**
   * Jalankan Server Action: tampilkan indikator proses, toast sukses/gagal, kembalikan hasilnya.
   * `label` = teks indikator ("Menyimpan...", "Menghapus...").
   */
  track: <T>(p: Promise<Result<T>>, okMsg?: string, label?: string) => Promise<Result<T>>
  /** Indikator berpersen (mis. upload banyak foto). `null` untuk menutup. */
  setProgress: (p: Progress | null) => void
}

const FeedbackCtx = createContext<Ctx | null>(null)

export function useFeedback() {
  const c = useContext(FeedbackCtx)
  if (!c) throw new Error('useFeedback harus di dalam FeedbackProvider')
  return c
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(0)
  const [busyLabel, setBusyLabel] = useState('Menyimpan...')
  const [progress, setProgress] = useState<Progress | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const toast = useCallback((m: string) => {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2400)
  }, [])

  const track = useCallback(
    async <T,>(p: Promise<Result<T>>, okMsg?: string, label = 'Menyimpan...') => {
      setBusyLabel(label)
      setBusy((n) => n + 1)
      try {
        const r = await p
        if (!r.ok) toast(r.error)
        else if (okMsg) toast(okMsg)
        return r
      } catch {
        toast('Gagal terhubung. Coba lagi.')
        return { ok: false, error: 'Gagal terhubung' } as Result<T>
      } finally {
        setBusy((n) => n - 1)
      }
    },
    [toast],
  )

  const value = useMemo(() => ({ toast, track, setProgress }), [toast, track])
  const active = progress !== null || busy > 0

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      {active && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[calc(8px+env(safe-area-inset-top))]"
        >
          <div className="w-[min(320px,100%)] rounded-2xl bg-ink px-4 py-3 text-white shadow-lg">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{progress?.label ?? busyLabel}</span>
              {progress && <span className="tabular-nums">{Math.round(progress.pct)}%</span>}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
              {progress ? (
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-200"
                  style={{ width: `${Math.max(4, Math.min(100, progress.pct))}%` }}
                />
              ) : (
                <div className="progress-indeterminate h-full w-1/3 rounded-full bg-white" />
              )}
            </div>
          </div>
        </div>
      )}
      {msg && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4">
          <div role="alert" className="max-w-[420px] rounded-xl bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
            {msg}
          </div>
        </div>
      )}
    </FeedbackCtx.Provider>
  )
}
