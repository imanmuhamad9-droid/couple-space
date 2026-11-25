'use client'

import { useState, type FormEvent } from 'react'
import { saveTransaksi } from '@/app/actions/transaksi'
import type { Transaksi } from '@/lib/types'
import { useFeedback } from './Feedback'
import { Field, inputCls, PickerField, SubmitButton } from './ui'

const rb = (n: number) => new Intl.NumberFormat('id-ID').format(n)

/** Isi sheet tambah/edit transaksi. Di-mount baru tiap sheet dibuka. `onDone` menerima tanggalnya. */
export function TransaksiForm({
  initial,
  today,
  onDone,
}: {
  initial: Transaksi | null
  today: string
  onDone: (tanggal: string) => void
}) {
  const { track } = useFeedback()
  const [jenis, setJenis] = useState<Transaksi['jenis']>(initial?.jenis ?? 'keluar')
  const [digits, setDigits] = useState(initial ? String(initial.jumlah) : '')
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveTransaksi({ id: initial?.id, tanggal, jenis, jumlah: Number(digits || 0), keterangan }),
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

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {seg('keluar', 'Uang keluar', 'bg-del text-white')}
        {seg('masuk', 'Uang masuk', 'bg-done text-white')}
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
      <Field label={jenis === 'keluar' ? 'Belanja apa' : 'Dari mana'}>
        <input
          required
          maxLength={200}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder={jenis === 'keluar' ? 'Contoh: Makan siang' : 'Contoh: Gaji'}
          className={inputCls}
        />
      </Field>
      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Simpan transaksi'}</SubmitButton>
    </form>
  )
}
