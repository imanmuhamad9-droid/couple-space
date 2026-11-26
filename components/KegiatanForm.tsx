'use client'

import { useState, type FormEvent } from 'react'
import { saveKegiatan } from '@/app/actions/kegiatan'
import { angka, kapitalAwal } from '@/lib/format'
import type { Kegiatan, TempatRingkas } from '@/lib/types'
import { useFeedback } from './Feedback'
import { PlaceSuggest } from './PlaceSuggest'
import { Field, inputCls, PickerField, SubmitButton } from './ui'

/** Isi sheet tambah/edit rencana. Di-mount baru tiap sheet dibuka, jadi state selalu segar. */
export function KegiatanForm({
  initial,
  today,
  tempat,
  onDone,
  tempatAwal = null,
}: {
  initial: Kegiatan | null
  today: string
  tempat: TempatRingkas[]
  onDone: () => void
  /** Rencana baru dari Database: lokasi sudah terisi tempat ini. */
  tempatAwal?: TempatRingkas | null
}) {
  const { track } = useFeedback()
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [jam, setJam] = useState(initial?.jam ?? '09:00')
  const [kegiatan, setKegiatan] = useState(initial?.kegiatan ?? '')
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? tempatAwal?.nama ?? '')
  const [picked, setPicked] = useState<TempatRingkas | null>(
    () => tempat.find((t) => t.id === initial?.tempatId) ?? tempatAwal,
  )
  const [budget, setBudget] = useState(initial && initial.budget > 0 ? String(initial.budget) : '')
  const [busy, setBusy] = useState(false)

  // Mengubah teks setelah memilih berarti bukan tempat itu lagi: putuskan hubungannya.
  function onText(v: string) {
    setLokasi(v)
    if (picked && v !== picked.nama) setPicked(null)
  }

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
        // uuid = terhubung, null = putus dari tempat sebelumnya, undefined = tidak berubah
        tempatId: picked ? picked.id : initial?.tempatId ? null : undefined,
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
          onChange={(e) => setKegiatan(kapitalAwal(e.target.value))}
          placeholder="Contoh: Ngopi di Bandung"
          className={inputCls}
        />
      </Field>
      <PlaceSuggest
        label="Lokasi (nama tempat, teks, atau link Maps)"
        places={tempat}
        value={lokasi}
        picked={picked}
        onText={onText}
        onPick={(t) => {
          setPicked(t)
          setLokasi(t.nama)
        }}
      />
      <Field label="Budget (Rp)">
        <input
          inputMode="numeric"
          autoComplete="off"
          value={budget ? angka(Number(budget)) : ''}
          onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="0"
          className={inputCls}
        />
      </Field>
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Tambah rencana'}</SubmitButton>
    </form>
  )
}
