'use client'

import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { LocateFixed, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { mapsUrl, type Coords } from '@/lib/geo'
import type { Tempat } from '@/lib/types'

export type MapPlace = { tempat: Tempat; km: number | null }

type Props = {
  places: MapPlace[]
  me: Coords | null
  onLocate: () => void
  onClose: () => void
}

/** Peta layar penuh (Leaflet + OpenStreetMap, gratis tanpa API key). Zoom: cubit, ketuk dua kali, atau tombol +/-. */
export default function MapView({ places, me, onLocate, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LMap | null>(null)
  const pins = useRef<LayerGroup | null>(null)
  const meDot = useRef<CircleMarker | null>(null)
  const leaflet = useRef<typeof import('leaflet') | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  // Buat peta sekali.
  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const L = (await import('leaflet')).default
        // Plugin pengelompok pin membaca L global.
        ;(window as unknown as { L: typeof L }).L = L
        await import('leaflet.markercluster')
        if (dead || !box.current) return

        const m = L.map(box.current, { zoomControl: false, attributionControl: true, maxZoom: 19 }).setView([-2.5, 118], 5)
        L.control.zoom({ position: 'bottomleft' }).addTo(m)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(m)

        leaflet.current = L
        map.current = m
        setReady(true)
      } catch {
        if (!dead) setFailed(true)
      }
    })()
    return () => {
      dead = true
      map.current?.remove()
      map.current = null
      pins.current = null
      meDot.current = null
    }
  }, [])

  // Pin tempat: diganti tiap daftar berubah. Bingkai peta hanya diatur saat pertama muncul.
  const framed = useRef(false)
  useEffect(() => {
    const L = leaflet.current
    const m = map.current
    if (!ready || !L || !m) return

    pins.current?.remove()
    const group: LayerGroup =
      typeof (L as unknown as { markerClusterGroup?: unknown }).markerClusterGroup === 'function'
        ? (L as unknown as { markerClusterGroup: (o: object) => LayerGroup }).markerClusterGroup({
            maxClusterRadius: 45,
            showCoverageOnHover: false,
          })
        : L.layerGroup()

    const icon = L.divIcon({ className: '', html: '<div class="map-pin"></div>', iconSize: [26, 26], iconAnchor: [13, 28] })
    const points: [number, number][] = []

    for (const { tempat: t, km } of places) {
      if (t.lat === null || t.lng === null) continue
      const marker = L.marker([t.lat, t.lng], { icon, title: t.nama })

      // Konten popup dirakit sebagai node DOM (textContent), bukan HTML, supaya nama tempat tidak bisa menyisipkan kode.
      const el = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = t.nama
      title.style.cssText = 'display:block;font-size:15px;margin-bottom:2px'
      const meta = document.createElement('div')
      meta.textContent = `${t.kategori} · ${t.kota}`
      meta.style.cssText = 'color:#6b7280;font-size:12px'
      el.append(title, meta)
      if (km !== null) {
        const d = document.createElement('div')
        d.textContent = `± ${km.toFixed(1)} km dari kamu`
        d.style.cssText = 'color:#2563eb;font-size:12px;font-weight:600'
        el.append(d)
      }
      const a = document.createElement('a')
      a.href = mapsUrl(t)
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.textContent = 'Buka di Maps'
      a.style.cssText = 'display:inline-block;margin-top:8px;padding:6px 12px;border-radius:999px;background:#2563eb;color:#fff;font-size:12px;font-weight:600;text-decoration:none'
      el.append(a)

      marker.bindPopup(el, { maxWidth: 240, closeButton: false })
      group.addLayer(marker)
      points.push([t.lat, t.lng])
    }
    group.addTo(m)
    pins.current = group

    if (!framed.current) {
      framed.current = true
      const all = me ? [...points, [me.lat, me.lng] as [number, number]] : points
      if (all.length > 1) m.fitBounds(L.latLngBounds(all), { padding: [50, 50], maxZoom: 15 })
      else if (all.length === 1) m.setView(all[0], 15)
    }
  }, [ready, places, me])

  // Titik biru posisi pengguna.
  useEffect(() => {
    const L = leaflet.current
    const m = map.current
    if (!ready || !L || !m) return
    meDot.current?.remove()
    meDot.current = null
    if (!me) return
    meDot.current = L.circleMarker([me.lat, me.lng], {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: '#2563eb',
      fillOpacity: 1,
    })
      .bindTooltip('Posisimu', { direction: 'top' })
      .addTo(m)
  }, [ready, me])

  // Tutup dengan Escape; halaman di belakang tidak ikut bergulir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function toMe() {
    if (!me) return onLocate()
    map.current?.flyTo([me.lat, me.lng], Math.max(map.current.getZoom(), 15))
  }

  const count = places.filter((p) => p.tempat.lat !== null).length
  const btn = 'grid size-11 place-items-center rounded-full bg-white text-ink shadow-lg active:scale-95'

  return (
    <div className="fixed inset-0 z-50 bg-gray-200">
      <div ref={box} className="size-full" />

      {!ready && !failed && (
        <div className="absolute inset-0 grid place-items-center text-muted">Memuat peta...</div>
      )}
      {failed && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center text-muted">
          Peta gagal dimuat. Periksa koneksi internet lalu coba lagi.
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between px-4 pt-[calc(12px+env(safe-area-inset-top))]">
        <span className="pointer-events-auto rounded-full bg-white px-3.5 py-2 text-sm font-semibold shadow-lg">
          {count} tempat
        </span>
        <button type="button" onClick={onClose} aria-label="Tutup peta" className={`${btn} pointer-events-auto`}>
          <X size={22} />
        </button>
      </div>

      <div className="absolute bottom-[calc(24px+env(safe-area-inset-bottom))] right-4 z-[1000]">
        <button type="button" onClick={toMe} aria-label="Ke posisi saya" className={btn}>
          <LocateFixed size={22} className={me ? 'text-upload' : ''} />
        </button>
      </div>
    </div>
  )
}
