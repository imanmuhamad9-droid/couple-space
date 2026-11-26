'use client'

import { useRef, useState, type FormEvent } from 'react'
import { saveTempat } from '@/app/actions/tempat'
import { useUpload } from '@/hooks/useUpload'
import { KATEGORI, KOTA } from '@/lib/constants'
import { kapitalAwal } from '@/lib/format'
import type { Tempat } from '@/lib/types'
import { useFeedback } from './Feedback'
import { Field, inputCls, PickerField, SubmitButton } from './ui'

/** Isi sheet tambah/edit tempat. Di-mount baru tiap sheet dibuka. */
export function TempatForm({ initial, onDone }: { initial: Tempat | null; onDone: () => void }) {
  const { track, toast } = useFeedback()
  const upload = useUpload()
  const fileInput = useRef<HTMLInputElement>(null)
  const [nama, setNama] = useState(initial?.nama ?? '')
  const [kategori, setKategori] = useState(initial?.kategori ?? KATEGORI[0])
  const [kota, setKota] = useState(initial?.kota ?? KOTA[0])
  const [buka, setBuka] = useState(initial?.buka ?? '')
  const [tutup, setTutup] = useState(initial?.tutup ?? '')
  const [linkMaps, setLinkMaps] = useState(initial?.linkMaps ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveTempat({
        id: initial?.id,
        nama,
        kategori: kategori as (typeof KATEGORI)[number],
        kota: kota as (typeof KOTA)[number],
        buka,
        tutup,
        linkMaps,
      }),
    )
    if (r.ok) {
      if (r.data.via === 'nama') toast('Tersimpan. Koordinat dicari dari nama tempat, jadi hanya perkiraan.')
      else if (r.data.via === null) toast(`Tersimpan, tapi koordinat tidak terbaca (${r.data.note}).`)
      else toast('Tersimpan')
      if (files.length) await upload('tempat', r.data.id, files)
      onDone()
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nama tempat">
        <input required maxLength={150} value={nama} onChange={(e) => setNama(kapitalAwal(e.target.value))} className={inputCls} />
      </Field>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Field label="Kategori">
          <select required value={kategori} onChange={(e) => setKategori(e.target.value)} className={inputCls}>
            {KATEGORI.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Kota">
          <select required value={kota} onChange={(e) => setKota(e.target.value)} className={inputCls}>
            {KOTA.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <PickerField label="Jam buka" type="time" value={buka} onChange={setBuka} />
        <PickerField label="Jam tutup" type="time" value={tutup} onChange={setTutup} />
      </div>
      <Field label="Link Google Maps">
        <input
          value={linkMaps}
          onChange={(e) => setLinkMaps(e.target.value)}
          maxLength={1000}
          placeholder="https://maps.app.goo.gl/..."
          className={inputCls}
        />
      </Field>

      <div>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="h-11 w-full rounded-xl border border-dashed border-line text-sm font-medium text-muted"
        >
          {files.length ? `${files.length} foto dipilih` : 'Pilih foto'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Tambah tempat'}</SubmitButton>
    </form>
  )
}
