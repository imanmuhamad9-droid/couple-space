'use client'

import { useState, type FormEvent } from 'react'
import { saveKegiatan } from '@/app/actions/kegiatan'
import type { Kegiatan } from '@/lib/types'
import { useFeedback } from './Feedback'
import { Field, inputCls, PickerField, SubmitButton } from './ui'

/** Isi sheet tambah/edit rencana. Di-mount baru tiap sheet dibuka, jadi state selalu segar. */
export function KegiatanForm({
  initial,
  today,
  onDone,
}: {
  initial: Kegiatan | null
  today: string
  onDone: () => void
}) {
  const { track } = useFeedback()
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [jam, setJam] = useState(initial?.jam ?? '09:00')
  const [kegiatan, setKegiatan] = useState(initial?.kegiatan ?? '')
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? '')
  const [budget, setBudget] = useState(initial && initial.budget > 0 ? String(initial.budget) : '')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveKegiatan({
        id: initial?.id,
        tanggal,
        jam,
        kegiatan,
        lokasi,
        budget: budget === '' ? 0 : Number(budget),
      }),
      'Tersimpan',
    )
    setBusy(false)
    if (r.ok) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
        <PickerField label="Jam" type="time" required value={jam} onChange={setJam} />
      </div>
      <Field label="Mau ngapain">
        <input
          required
          maxLength={200}
          value={kegiatan}
          onChange={(e) => setKegiatan(e.target.value)}
          placeholder="Contoh: Ngopi di Bandung"
          className={inputCls}
        />
      </Field>
      <Field label="Lokasi (teks atau link Google Maps)">
        <input value={lokasi} onChange={(e) => setLokasi(e.target.value)} maxLength={500} className={inputCls} />
      </Field>
      <Field label="Budget (Rp, opsional)">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={budget}
          onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          className={inputCls}
        />
      </Field>
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Tambah rencana'}</SubmitButton>
    </form>
  )
}
