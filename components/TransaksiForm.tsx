'use client'

import { useState, type FormEvent } from 'react'
import { saveTransaksi } from '@/app/actions/transaksi'
import { angka as rb, kapitalAwal, rupiah } from '@/lib/format'
import { sarankanKeterangan, type SaranKeterangan } from '@/lib/suggest'
import type { Dompet, Transaksi } from '@/lib/types'
import { useFeedback } from './Feedback'
import { Field, inputCls, PickerField, SubmitButton } from './ui'


/** Dompet lain selain `id` (untuk tujuan pindah dana). */
const lain = (dompet: Dompet[], id: string) => dompet.find((d) => d.id !== id)?.id ?? ''

/**
 * Isi sheet tambah/edit transaksi. Di-mount baru tiap sheet dibuka.
 * `dompetAwal` = dompet bawaan untuk transaksi baru. Jenis (keluar/masuk/pindah) dipilih di dalam form.
 * `onDone` menerima tanggalnya.
 */
export function TransaksiForm({
  initial,
  today,
  dompet,
  dompetAwal,
  riwayat,
  onDone,
}: {
  initial: Transaksi | null
  today: string
  dompet: Dompet[]
  dompetAwal: string
  /** Transaksi yang sudah ada (terbaru di atas), untuk saran isi otomatis keterangan. */
  riwayat: Transaksi[]
  onDone: (tanggal: string) => void
}) {
  const { track } = useFeedback()
  const [jenis, setJenis] = useState<Transaksi['jenis']>(initial?.jenis ?? 'keluar')
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

  // Saran dari catatan sebelumnya (hanya untuk transaksi baru): satu ketukan mengisi keterangan, jumlah, dan dompet.
  const saran = !initial && jenis !== 'pindah' ? sarankanKeterangan(riwayat, jenis, keterangan) : []
  function pilihSaran(s: SaranKeterangan) {
    setKeterangan(s.keterangan)
    if (!digits) setDigits(String(s.jumlah))
    if (dompet.some((d) => d.id === s.dompetId)) setDompetId(s.dompetId)
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
    <select required value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
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

      <Field label={jenis === 'keluar' ? 'Belanja apa' : jenis === 'masuk' ? 'Dari mana' : 'Catatan'}>
        <input
          required={jenis !== 'pindah'}
          maxLength={200}
          value={keterangan}
          onChange={(e) => setKeterangan(kapitalAwal(e.target.value))}
          placeholder={jenis === 'keluar' ? 'Contoh: Makan siang' : jenis === 'masuk' ? 'Contoh: Gaji' : 'Contoh: Uang bulanan habis'}
          className={inputCls}
        />
      </Field>

      {saran.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted">Pernah kamu catat</p>
          <ul className="overflow-hidden rounded-xl border border-line bg-white">
            {saran.map((s) => (
              <li key={s.keterangan} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => pilihSaran(s)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left active:bg-gray-100"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.keterangan}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {rupiah(s.jumlah)} · {dompet.find((d) => d.id === s.dompetId)?.nama ?? ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Simpan'}</SubmitButton>
    </form>
  )
}
