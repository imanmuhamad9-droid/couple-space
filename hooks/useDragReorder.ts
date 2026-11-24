'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

const HOLD_MS = 400
const MOVE_TOLERANCE = 10
const EDGE = 90

export type DropTarget = { day: string; idx: number }

type Opts = {
  enabled: boolean
  /** Dipanggil saat kartu dilepas di posisi baru. idx = posisi di antara kartu lain (tanpa kartu ini). */
  onDrop: (id: string, day: string, idx: number) => void
}

/**
 * Tahan kartu ±400 ms lalu geser. Elemen hari harus punya `data-day`,
 * kartu harus punya `data-card-id`.
 */
export function useDragReorder({ enabled, onDrop }: Opts) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dy, setDy] = useState(0)
  const [target, setTarget] = useState<DropTarget | null>(null)

  const s = useRef({
    id: null as string | null,
    active: false,
    startX: 0,
    startY: 0,
    startScroll: 0,
    x: 0,
    y: 0,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    raf: 0,
    target: null as DropTarget | null,
  })
  const onDropRef = useRef(onDrop)
  useEffect(() => {
    onDropRef.current = onDrop
  })

  // Saat drag aktif, gulir halaman harus dimatikan. Listener non-passive dipasang sejak awal
  // karena Safari iOS mengabaikan preventDefault pada listener yang dipasang belakangan.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (s.current.active && e.cancelable) e.preventDefault()
    }
    document.addEventListener('touchmove', block, { passive: false })
    return () => document.removeEventListener('touchmove', block)
  }, [])

  const computeTarget = useCallback((x: number, y: number): DropTarget | null => {
    const days = Array.from(document.querySelectorAll<HTMLElement>('[data-day]'))
    for (const el of days) {
      const r = el.getBoundingClientRect()
      if (y < r.top - 12 || y > r.bottom + 12 || x < r.left || x > r.right) continue
      const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-card-id]')).filter(
        (c) => c.dataset.cardId !== s.current.id,
      )
      let idx = 0
      for (const c of cards) {
        const cr = c.getBoundingClientRect()
        if (y > cr.top + cr.height / 2) idx++
      }
      return { day: el.dataset.day!, idx }
    }
    return null
  }, [])

  const stop = useCallback(() => {
    clearTimeout(s.current.timer)
    cancelAnimationFrame(s.current.raf)
    s.current.active = false
    s.current.id = null
    s.current.target = null
    setDragId(null)
    setDy(0)
    setTarget(null)
  }, [])

  const autoScroll = useCallback(() => {
    const tick = () => {
      if (!s.current.active) return
      const { x, y } = s.current
      const before = window.scrollY
      if (y < EDGE) window.scrollBy(0, -14)
      else if (y > window.innerHeight - EDGE - 70) window.scrollBy(0, 14)
      if (window.scrollY !== before) {
        // halaman bergulir tanpa pointermove: perbarui posisi kartu dan target
        setDy(y - s.current.startY + (window.scrollY - s.current.startScroll))
        const t = computeTarget(x, y)
        s.current.target = t
        setTarget(t)
      }
      s.current.raf = requestAnimationFrame(tick)
    }
    s.current.raf = requestAnimationFrame(tick)
  }, [computeTarget])

  const bind = useCallback(
    (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return
        if ((e.target as HTMLElement).closest('button, a, input')) return
        const el = e.currentTarget
        const pointerId = e.pointerId
        s.current.id = id
        s.current.startX = e.clientX
        s.current.startY = e.clientY
        s.current.x = e.clientX
        s.current.y = e.clientY
        s.current.startScroll = window.scrollY
        clearTimeout(s.current.timer)
        s.current.timer = setTimeout(() => {
          s.current.active = true
          try {
            el.setPointerCapture(pointerId)
          } catch {
            /* pointer sudah dilepas */
          }
          if (navigator.vibrate) navigator.vibrate(12)
          setDragId(id)
          autoScroll()
        }, HOLD_MS)
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (s.current.id !== id) return
        if (!s.current.active) {
          // bergerak sebelum 400 ms = pengguna sedang menggulir, batalkan
          if (
            Math.abs(e.clientX - s.current.startX) > MOVE_TOLERANCE ||
            Math.abs(e.clientY - s.current.startY) > MOVE_TOLERANCE
          ) {
            clearTimeout(s.current.timer)
            s.current.id = null
          }
          return
        }
        s.current.x = e.clientX
        s.current.y = e.clientY
        setDy(e.clientY - s.current.startY + (window.scrollY - s.current.startScroll))
        const t = computeTarget(e.clientX, e.clientY)
        s.current.target = t
        setTarget(t)
      },
      onPointerUp: () => {
        if (s.current.id !== id) return
        const { active, target: t } = s.current
        stop()
        if (active && t) onDropRef.current(id, t.day, t.idx)
      },
      onPointerCancel: () => {
        if (s.current.id === id) stop()
      },
      onContextMenu: (e: React.MouseEvent) => {
        if (enabled) e.preventDefault()
      },
    }),
    [enabled, autoScroll, computeTarget, stop],
  )

  return { dragId, dy, target, bind }
}
