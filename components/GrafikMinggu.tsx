'use client'

import { useState } from 'react'
import { formatTanggalSingkat, rupiah } from '@/lib/format'

const LEBAR = 320
const TINGGI = 130
const TEPI = 14 // ruang untuk titik di pinggir
const DASAR = TINGGI - 22 // garis nol; di bawahnya label hari

const namaHari = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))

/**
 * Diagram garis total per hari (satu seri), lalu daftar nominalnya. Tekan satu hari di diagram
 * untuk menyorot nominalnya. `data` terurut dari hari terlama.
 */
export function GrafikMinggu({ data, warna }: { data: { tanggal: string; jumlah: number }[]; warna: string }) {
  const [pilih, setPilih] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.jumlah, 0)
  const maks = Math.max(1, ...data.map((d) => d.jumlah))
  const kolom = (LEBAR - 2 * TEPI) / (data.length - 1)
  const x = (i: number) => TEPI + i * kolom
  const y = (n: number) => DASAR - (n / maks) * (DASAR - TEPI)
  const sorot = pilih === null ? null : data[pilih]

  return (
    <div>
      <p className="text-sm text-muted">{sorot ? formatTanggalSingkat(sorot.tanggal) : 'Total 7 hari terakhir'}</p>
      <p className="text-2xl font-bold tabular-nums">{rupiah(sorot ? sorot.jumlah : total)}</p>

      <svg viewBox={`0 0 ${LEBAR} ${TINGGI}`} className={`mt-2 w-full ${warna}`} aria-hidden="true">
        <line x1={0} x2={LEBAR} y1={DASAR} y2={DASAR} className="stroke-line" />
        {pilih !== null && <line x1={x(pilih)} x2={x(pilih)} y1={TEPI / 2} y2={DASAR} className="stroke-line" />}
        <polyline
          points={data.map((d, i) => `${x(i)},${y(d.jumlah)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => (
          <g key={d.tanggal}>
            <circle cx={x(i)} cy={y(d.jumlah)} r={i === pilih ? 6 : 4} fill="currentColor" stroke="white" strokeWidth={2} />
            <text x={x(i)} y={TINGGI - 6} textAnchor="middle" className="fill-muted text-[10px]">
              {namaHari(d.tanggal)}
            </text>
            <rect
              x={x(i) - kolom / 2}
              y={0}
              width={kolom}
              height={TINGGI}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setPilih(i === pilih ? null : i)}
            />
          </g>
        ))}
      </svg>

      <dl className="mt-2 divide-y divide-line text-sm">
        {data
          .map((d, i) => (
            <div key={d.tanggal} className={`flex justify-between gap-3 py-1.5 ${i === pilih ? 'font-semibold' : ''}`}>
              <dt className="text-muted">
                {namaHari(d.tanggal)}, {formatTanggalSingkat(d.tanggal)}
              </dt>
              <dd className="tabular-nums">{rupiah(d.jumlah)}</dd>
            </div>
          ))
          .reverse()}
      </dl>
    </div>
  )
}
