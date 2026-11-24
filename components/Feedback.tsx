'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Result } from '@/lib/types'

type Ctx = {
  toast: (msg: string) => void
  /** Jalankan Server Action: tampilkan "Menyimpan...", toast sukses/gagal, kembalikan hasilnya. */
  track: <T>(p: Promise<Result<T>>, okMsg?: string) => Promise<Result<T>>
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
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const toast = useCallback((m: string) => {
    setMsg(m)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2400)
  }, [])

  const track = useCallback(
    async <T,>(p: Promise<Result<T>>, okMsg?: string) => {
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

  const value = useMemo(() => ({ toast, track }), [toast, track])

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      {busy > 0 && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center pt-[env(safe-area-inset-top)]"
        >
          <span className="mt-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white shadow">Menyimpan...</span>
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
