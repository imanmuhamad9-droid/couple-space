'use client'

import { useState, type FormEvent } from 'react'
import { saveTransaksi } from '@/app/actions/transaksi'
import type { Dompet, Transaksi } from '@/lib/types'
import { useFeedback } from './Feedback'
import { Field, inputCls, PickerField, SubmitButton } from './ui'

const rb = (n: number) => new Intl.NumberFormat('id-ID').format(n)

/** Dompet lain selain `id` (untuk tujuan pindah dana). */
const lain = (dompet: Dompet[], id: string) => dompet.find((d) => d.id !== id)?.id ?? ''

/**
 * Isi sheet tambah/edit transaksi. Di-mount baru tiap sheet dibuka.
 * `dompetAwal` = dompet bawaan untuk transaksi baru; `jenisAwal` = jenis bawaan (mis. "pindah" dari tombol Pindah dana).
 * `onDone` menerima tanggalnya.
 */
export function TransaksiForm({
  initial,
  today,
  dompet,
  dompetAwal,
  jenisAwal = 'keluar',
  onDone,
}: {
  initial: Transaksi | null
  today: string
  dompet: Dompet[]
  dompetAwal: string
  jenisAwal?: Transaksi['jenis']
  onDone: (tanggal: string) => void
}) {
  const { track } = useFeedback()
  const [jenis, setJenis] = useState<Transaksi['jenis']>(initial?.jenis ?? jenisAwal)
  const [dompetId, setDompetId] = useState(initial?.dompetId ?? dompetAwal)
  const [tujuanId, setTujuanId] = useState(initial?.tujuanId ?? lain(dompet, initial?.dompetId ?? dompetAwal))
  const [digits, setDigits] = useState(initial ? String(initial.jumlah) : '')
  // Catatan bawaan "Pindah dana" tidak ditampilkan di kolom isian.
  const [keterangan, setKeterangan] = useState(initial && initial.keterangan !== 'Pindah dana' ? initial.keterangan : '')
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [busy, setBusy] = useState(false)

  // Asal dan tujuan pindah dana tidak boleh sama: yang satunya otomatis berganti.
  function ubahAsal(id: string) {
    setDompetId(id)
    if (id === tujuanId) setTujuanId(lain(dompet, id))
  }
  function ubahTujuan(id: string) {
    setTujuanId(id)
    if (id === dompetId) setDompetId(lain(dompet, id))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveTransaksi({
        id: initial?.id,
        tanggal,
        jenis,
        jumlah: Number(digits || 0),
        keterangan,
        dompetId,
        tujuanId: jenis === 'pindah' ? tujuanId : null,
      }),
      'Tersimpan',
    )
    setBusy(false)
    if (r.ok) onDone(tanggal)
  }

  const seg = (j: Transaksi['jenis'], label: string, on: string) => (
    <button
      type="button"
      onClick={() => setJenis(j)}
      aria-pressed={jenis === j}
      className={`h-11 rounded-xl text-sm font-semibold ${jenis === j ? on : 'bg-gray-100 text-muted'}`}
    >
      {label}
    </button>
  )

  const pilihDompet = (value: string, onChange: (id: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {dompet.map((d) => (
        <option key={d.id} value={d.id}>
          {d.nama}
        </option>
      ))}
    </select>
  )

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {seg('keluar', 'Keluar', 'bg-del text-white')}
        {seg('masuk', 'Masuk', 'bg-done text-white')}
        {seg('pindah', 'Pindah', 'bg-upload text-white')}
      </div>

      <Field label="Jumlah (Rp)">
        <input
          required
          inputMode="numeric"
          autoComplete="off"
          value={digits ? rb(Number(digits)) : ''}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 15))}
          placeholder="0"
          className={inputCls}
        />
      </Field>

      {jenis === 'pindah' ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <Field label="Dari dompet">{pilihDompet(dompetId, ubahAsal)}</Field>
          <Field label="Ke dompet">{pilihDompet(tujuanId, ubahTujuan)}</Field>
        </div>
      ) : (
        <Field label="Dompet">{pilihDompet(dompetId, setDompetId)}</Field>
      )}

      <Field label={jenis === 'keluar' ? 'Belanja apa' : jenis === 'masuk' ? 'Dari mana' : 'Catatan (opsional)'}>
        <input
          required={jenis !== 'pindah'}
          maxLength={200}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder={jenis === 'keluar' ? 'Contoh: Makan siang' : jenis === 'masuk' ? 'Contoh: Gaji' : 'Contoh: Uang bulanan habis'}
          className={inputCls}
        />
      </Field>

      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Simpan'}</SubmitButton>
    </form>
  )
}
