import { describe, expect, it } from 'vitest'
import { haversineKm, parseCoords } from '../lib/geo'

describe('parseCoords', () => {
  it('lat, lng polos', () => {
    expect(parseCoords('-6.2088, 106.8456')).toEqual({ lat: -6.2088, lng: 106.8456 })
  })
  it('link dengan @lat,lng', () => {
    const url = 'https://www.google.com/maps/place/Kopi/@-6.9175,107.6191,17z/data=!4m6'
    expect(parseCoords(url)).toEqual({ lat: -6.9175, lng: 107.6191 })
  })
  it('link dengan !3d!4d lebih diutamakan', () => {
    const url = 'https://www.google.com/maps/place/X/@-6.9,107.6,17z/data=!3d-6.9175!4d107.6191'
    expect(parseCoords(url)).toEqual({ lat: -6.9175, lng: 107.6191 })
  })
  it('link dengan ?q=lat,lng', () => {
    expect(parseCoords('https://maps.google.com/?q=-7.25,112.75')).toEqual({ lat: -7.25, lng: 112.75 })
  })
  it('link tempat Google tanpa koordinat: didekode dari kode tempat', () => {
    const seniman = parseCoords(
      'https://www.google.com/maps/place/Seniman+Coffee+Studio/data=!4m2!3m1!1s0x2dd23d6a065b98bb:0x6fa247aced3b9ae2',
    )
    expect(seniman?.lat).toBeCloseTo(-8.5053, 3)
    expect(seniman?.lng).toBeCloseTo(115.2654, 3)
    const changi = parseCoords(
      'https://www.google.com/maps/place/Terminal+1/data=!4m2!3m1!1s0x31da3c89a3c3b2ed:0xd0e818ee3ec7554f',
    )
    expect(changi?.lat).toBeCloseTo(1.3612, 3)
    expect(changi?.lng).toBeCloseTo(103.9915, 3)
  })
  it('kode tempat yang rusak tidak jadi koordinat ngawur', () => {
    expect(parseCoords('https://www.google.com/maps/place/X/data=!4m2!3m1!1s0x5045cac6dd5666b:0xa20ec64c8cffc80c')).toBeNull()
  })
  it('menolak teks biasa dan koordinat di luar rentang', () => {
    expect(parseCoords('Kopi Tuku Cipete')).toBeNull()
    expect(parseCoords('200, 300')).toBeNull()
    expect(parseCoords('')).toBeNull()
  })
})

describe('haversineKm', () => {
  it('Jakarta - Bandung sekitar 115 km', () => {
    const d = haversineKm({ lat: -6.2088, lng: 106.8456 }, { lat: -6.9175, lng: 107.6191 })
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(125)
  })
  it('titik yang sama = 0', () => {
    expect(haversineKm({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0)
  })
})
