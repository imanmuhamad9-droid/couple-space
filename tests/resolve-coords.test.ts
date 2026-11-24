import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveCoords } from '../lib/resolve-coords'

const PLACE =
  'https://www.google.com/maps/place/De.u+Coffee+Dago/@-6.8712183,107.625058,17z/data=!3m1!4b1!4m6!3m5!1s0x2e68e700012fb48d:0xc87f78ca612f89f7!8m2!3d-6.8712236!4d107.6276329?entry=tts'

const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } })

function mockFetch(handler: (url: string) => Response) {
  vi.stubGlobal('fetch', vi.fn(async (u: URL | string) => handler(String(u))))
}

afterEach(() => vi.unstubAllGlobals())

describe('resolveCoords', () => {
  it('link share pendek diikuti sampai halaman tempat', async () => {
    mockFetch((u) => (u.includes('maps.app.goo.gl') ? redirect(PLACE) : new Response('')))
    const r = await resolveCoords('https://maps.app.goo.gl/abc', 'X', 'Bandung')
    expect(r).toEqual({ coords: { lat: -6.8712236, lng: 107.6276329 }, via: 'link', note: '' })
  })

  it('halaman persetujuan cookie yang membawa link tujuan tetap terbaca', async () => {
    const consent = `https://consent.google.com/m?continue=${encodeURIComponent(PLACE)}&gl=DE`
    mockFetch(() => redirect(consent))
    const r = await resolveCoords('https://maps.app.goo.gl/abc', 'X', 'Bandung')
    expect(r.coords?.lat).toBeCloseTo(-6.8712, 3)
  })

  it('koordinat di dalam isi halaman (status 200)', async () => {
    mockFetch(() => new Response('<html>... @-7.25,112.75,17z ...</html>', { status: 200 }))
    const r = await resolveCoords('https://www.google.com/maps/place/Foo', 'Foo', 'Surabaya')
    expect(r.coords).toEqual({ lat: -7.25, lng: 112.75 })
  })

  it('host selain Google ditolak, lalu mencoba lewat nama', async () => {
    const calls: string[] = []
    mockFetch((u) => {
      calls.push(u)
      return u.includes('nominatim') ? Response.json([{ lat: '-6.2', lon: '106.8' }]) : new Response('')
    })
    const r = await resolveCoords('https://evil.example.com/x', 'Monas', 'Jakarta')
    expect(r.via).toBe('nama')
    expect(calls.every((c) => c.includes('nominatim'))).toBe(true) // evil.example.com tidak pernah diakses
  })

  it('gagal semua: alasan dikembalikan', async () => {
    mockFetch((u) => (u.includes('nominatim') ? Response.json([]) : new Response('', { status: 429 })))
    const r = await resolveCoords('https://maps.app.goo.gl/abc', 'Tidak ada', 'Bandung')
    expect(r.coords).toBeNull()
    expect(r.note).toContain('429')
  })
})
