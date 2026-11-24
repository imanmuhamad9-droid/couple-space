'use client'

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { ME_KEY } from '@/lib/constants'
import { parseCoords, type Coords } from '@/lib/geo'

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(ME_KEY)
  } catch {
    return null
  }
}

function write(c: Coords) {
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(c))
  } catch {
    /* penyimpanan diblokir: lokasi tetap dipakai sampai halaman ditutup */
  }
  listeners.forEach((l) => l())
}

/** Lokasi pengguna: GPS (timeout 7 dtk) dengan fallback isian manual. Disimpan di localStorage. */
export function useLocation() {
  const raw = useSyncExternalStore(subscribe, read, () => null)
  const me = useMemo<Coords | null>(() => {
    if (!raw) return null
    try {
      const c = JSON.parse(raw)
      return typeof c.lat === 'number' && typeof c.lng === 'number' ? c : null
    } catch {
      return null
    }
  }, [raw])
  const [locating, setLocating] = useState(false)

  /** Resolve true jika GPS berhasil; false jika gagal/ditolak (tampilkan isian manual). */
  const locate = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (!('geolocation' in navigator)) return resolve(false)
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
          (p) => {
            write({ lat: p.coords.latitude, lng: p.coords.longitude })
            setLocating(false)
            resolve(true)
          },
          () => {
            setLocating(false)
            resolve(false)
          },
          { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
        )
      }),
    [],
  )

  /** Terima "lat, lng" atau link Google Maps yang berisi koordinat. */
  const setManual = useCallback((text: string) => {
    const c = parseCoords(text)
    if (c) write(c)
    return c !== null
  }, [])

  return { me, locating, locate, setManual }
}
