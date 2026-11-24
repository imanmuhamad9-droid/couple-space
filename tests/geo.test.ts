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
