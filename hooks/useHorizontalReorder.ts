'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { indeksSisip } from '@/lib/urut'

const HOLD_MS = 400
const MOVE_TOLERANCE = 10
const EDGE = 56

/**
 * Tekan lama sebuah kartu lalu geser ke kiri atau kanan untuk mengubah urutannya.
 * Kartu yang bisa digeser memakai `data-wallet-id`; `rail` adalah wadah yang bisa digulir
 * (harus `position: relative`). Saat drag aktif, `dragId` terisi: wadah sebaiknya mengecilkan kartu
 * dan mematikan scroll-snap agar beberapa kartu terlihat sekaligus.
 */
export function useHorizontalReorder({
  rail,
  enabled,
  onDrop,
}: {
  rail: RefObject<HTMLElement | null>
  enabled: boolean
  /** idx = posisi di antara kartu lain (tanpa kartu yang digeser). */
  onDrop: (id: string, idx: number) => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dx, setDx] = useState(0)
  const [barX, setBarX] = useState<number | null>(null)

  const s = useRef({
    id: null as string | null,
    active: false,
    startX: 0,
    startY: 0,
    x: 0,
    idx: 0,
    aligned: false,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    raf: 0,
  })
  const onDropRef = useRef(onDrop)
  useEffect(() => {
    onDropRef.current = onDrop
  })

  // Saat drag aktif, gulir bawaan harus dimatikan. Dipasang sejak awal (non-passive) agar Safari iOS menurutinya.
  useEffect(() => {
    const block = (e: TouchEvent) => {
      if (s.current.active && e.cancelable) e.preventDefault()
    }
    document.addEventListener('touchmove', block, { passive: false })
    return () => document.removeEventListener('touchmove', block)
  }, [])

  const stop = useCallback(() => {
    clearTimeout(s.current.timer)
    cancelAnimationFrame(s.current.raf)
    s.current.active = false
    s.current.id = null
    setDragId(null)
    setDx(0)
    setBarX(null)
  }, [])

  // Satu putaran per frame: sejajarkan kartu dengan jari, gulir di tepi, hitung posisi sisip.
  const loop = useCallback(() => {
    const tick = () => {
      const st = s.current
      if (!st.active) return
      const el = rail.current
      if (el) {
        const all = Array.from(el.querySelectorAll<HTMLElement>('[data-wallet-id]'))
        const me = all.find((c) => c.dataset.walletId === st.id)
        if (me) {
          const box = el.getBoundingClientRect()
          // Setelah kartu mengecil, taruh kartu yang dipegang tepat di bawah jari (sekali).
          if (!st.aligned && me.offsetWidth < el.clientWidth * 0.6) {
            el.scrollLeft = me.offsetLeft + me.offsetWidth / 2 - (st.x - box.left)
            st.aligned = true
          }
          if (st.x < box.left + EDGE) el.scrollLeft -= 12
          else if (st.x > box.right - EDGE) el.scrollLeft += 12

          const centerOf = (c: HTMLElement) => box.left - el.scrollLeft + c.offsetLeft + c.offsetWidth / 2
          const others = all.filter((c) => c !== me)
          const idx = indeksSisip(others.map(centerOf), st.x)
          st.idx = idx
          setDx(st.x - centerOf(me))
          if (others.length > 0) {
            const edge = idx === 0 ? others[0].offsetLeft - 4 : others[idx - 1].offsetLeft + others[idx - 1].offsetWidth + 4
            setBarX(edge - 2)
          }
        }
      }
      st.raf = requestAnimationFrame(tick)
    }
    s.current.raf = requestAnimationFrame(tick)
  }, [rail])

  const bind = useCallback(
    (id: string) => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return
        if ((e.target as HTMLElement).closest('button, a, input')) return
        const el = e.currentTarget
        const pointerId = e.pointerId
        const st = s.current
        st.id = id
        st.startX = e.clientX
        st.startY = e.clientY
        st.x = e.clientX
        st.aligned = false
        clearTimeout(st.timer)
        st.timer = setTimeout(() => {
          st.active = true
          try {
            el.setPointerCapture(pointerId)
          } catch {
            /* pointer sudah dilepas */
          }
          if (navigator.vibrate) navigator.vibrate(12)
          setDragId(id)
          loop()
        }, HOLD_MS)
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        const st = s.current
        if (st.id !== id) return
        st.x = e.clientX
        // Bergerak sebelum 400 ms berarti pengguna sedang menggulir: batalkan.
        if (!st.active && (Math.abs(e.clientX - st.startX) > MOVE_TOLERANCE || Math.abs(e.clientY - st.startY) > MOVE_TOLERANCE)) {
          clearTimeout(st.timer)
          st.id = null
        }
      },
      onPointerUp: () => {
        const st = s.current
        if (st.id !== id) return
        const { active, idx } = st
        stop()
        if (active) onDropRef.current(id, idx)
      },
      onPointerCancel: () => {
        if (s.current.id === id) stop()
      },
      onContextMenu: (e: React.MouseEvent) => {
        if (enabled) e.preventDefault()
      },
    }),
    [enabled, loop, stop],
  )

  return { dragId, dx, barX, bind }
}
