'use client'

import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 20_000)
  return () => clearInterval(t)
}

/** Menit sejak epoch, diperbarui otomatis. Di server bernilai 0 (tidak ada sorotan saat hidrasi). */
export function useMinute(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000),
    () => 0,
  )
}
