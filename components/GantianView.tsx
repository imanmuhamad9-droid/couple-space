'use client'

import { ArrowLeft, Copy, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { bayarGantian, deleteGantian, saveNamaGantian, saveTalang } from '@/app/actions/gantian'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { angka, formatTanggal, kapitalAwal, rupiah } from '@/lib/format'
import { kalimatSaldo, nilai, rekapGantian, saldoGantian, type Gantian, type Pelaku } from '@/lib/gantian'
import { useFeedback } from './Feedback'
import { ConfirmSheet, Sheet } from './Sheet'
import { Empty, Field, inputCls, PageHeader, Pagination, PickerField, SubmitButton } from './ui'

function Pilihan<T extends string>({
  value,
  onChange,
  opsi,
}: {
  value: T
  onChange: (v: T) => void
  opsi: [T, string][]
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {opsi.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`h-11 truncate rounded-xl px-2 text-sm font-semibold ${value === v ? 'bg-upload text-white' : 'bg-gray-100 text-muted'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function InputRupiah({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input
        required
        inputMode="numeric"
        autoComplete="off"
        value={value ? angka(Number(value)) : ''}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 14))}
        placeholder="0"
        className={inputCls}
      />
    </Field>
  )
}

function CatatForm({
  initial,
  nama,
  today,
  onDone,
}: {
  initial: Gantian | null
  nama: string
  today: string
  onDone: () => void
}) {
  const { track } = useFeedback()
  const [pelaku, setPelaku] = useState<Pelaku>(initial?.pelaku ?? 'aku')
  const [jumlah, setJumlah] = useState(initial ? String(initial.jumlah) : '')
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')
  const [hitung, setHitung] = useState<'penuh' | 'bagi'>(initial?.bagi ? 'bagi' : 'penuh')
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [busy, setBusy] = useState(false)

  const bagi = hitung === 'bagi'
  const berutang = pelaku === 'aku' ? nama : 'Aku'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveTalang({ id: initial?.id, tanggal, pelaku, jumlah: Number(jumlah || 0), bagi, keterangan }),
      'Tersimpan',
    )
    setBusy(false)
    if (r.ok) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-medium text-muted">Siapa yang bayar</p>
        <Pilihan value={pelaku} onChange={setPelaku} opsi={[['aku', 'Aku'], ['dia', nama]]} />
      </div>
      <InputRupiah label="Jumlah (Rp)" value={jumlah} onChange={setJumlah} />
      <Field label="Untuk apa">
        <input
          required
          maxLength={200}
          value={keterangan}
          onChange={(e) => setKeterangan(kapitalAwal(e.target.value))}
          placeholder="Contoh: Makan malam"
          className={inputCls}
        />
      </Field>
      <div>
        <Pilihan value={hitung} onChange={setHitung} opsi={[['penuh', 'Talangin penuh'], ['bagi', 'Bagi dua']]} />
        {jumlah !== '' && (
          <p className="mt-1 text-xs text-muted">
            {berutang} berutang {rupiah(nilai({ jenis: 'talang', jumlah: Number(jumlah), bagi }))}
          </p>
        )}
      </div>
      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Simpan'}</SubmitButton>
    </form>
  )
}

function BayarForm({ saldo, nama, today, onDone }: { saldo: number; nama: string; today: string; onDone: () => void }) {
  const { track, toast } = useFeedback()
  const total = Math.abs(saldo)
  const [jumlah, setJumlah] = useState(String(total))
  const [tanggal, setTanggal] = useState(today)
  const [busy, setBusy] = useState(false)
  const sisa = total - Number(jumlah || 0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      bayarGantian({ tanggal, pelaku: saldo > 0 ? 'dia' : 'aku', jumlah: Number(jumlah || 0) }),
      'Pembayaran tercatat',
    )
    setBusy(false)
    if (r.ok) onDone()
  }

  // Yang disalin angka polos (tanpa "Rp" dan titik) supaya bisa langsung ditempel di aplikasi bank.
  async function salin() {
    try {
      await navigator.clipboard.writeText(jumlah)
      toast(`Disalin: ${jumlah}`)
    } catch {
      toast('Gagal menyalin. Salin manual dari kotaknya.')
    }
  }

  const cepat = (label: string, n: number) => (
    <button type="button" onClick={() => setJumlah(String(n))} className="h-10 rounded-xl bg-gray-100 text-sm font-semibold">
      {label}
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-muted">
        {kalimatSaldo(saldo, nama)} {rupiah(total)}
      </p>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <InputRupiah label="Dibayar (Rp)" value={jumlah} onChange={setJumlah} />
        </div>
        <button
          type="button"
          onClick={salin}
          disabled={!jumlah}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold disabled:opacity-40"
        >
          <Copy size={16} /> Salin
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cepat('Semua', total)}
        {cepat('Setengah', Math.ceil(total / 2))}
      </div>
      <p className={`text-xs ${sisa < 0 ? 'text-del' : 'text-muted'}`}>
        {sisa < 0 ? 'Melebihi yang harus dibayar.' : sisa === 0 ? 'Setelah ini impas.' : `Sisa ${rupiah(sisa)} tetap tercatat.`}
      </p>
      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>Catat pembayaran</SubmitButton>
    </form>
  )
}

function NamaForm({ nama, onDone }: { nama: string; onDone: () => void }) {
  const { track } = useFeedback()
  const [value, setValue] = useState(nama)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(saveNamaGantian(value), 'Tersimpan')
    setBusy(false)
    if (r.ok) onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Gantian dengan">
        <input
          required
          maxLength={30}
          value={value}
          onChange={(e) => setValue(kapitalAwal(e.target.value))}
          className={inputCls}
        />
      </Field>
      <SubmitButton busy={busy}>Simpan</SubmitButton>
    </form>
  )
}

export function GantianView({
  siap,
  nama,
  items,
  today,
}: {
  siap: boolean
  nama: string
  items: Gantian[]
  today: string
}) {
  const { track } = useFeedback()
  const [sheet, setSheet] = useState<'catat' | 'bayar' | 'nama' | null>(null)
  const [editing, setEditing] = useState<Gantian | null>(null)
  const [selected, setSelected] = useState<Gantian | null>(null)
  const [deleting, setDeleting] = useState<Gantian | null>(null)
  const [page, setPage] = useState(0)

  const saldo = saldoGantian(items)
  const pages = Math.max(1, Math.ceil(items.length / ITEM_PER_HALAMAN))
  const cur = Math.min(page, pages - 1)
  const tampil = items.slice(cur * ITEM_PER_HALAMAN, (cur + 1) * ITEM_PER_HALAMAN)
  const hari = [...new Set(tampil.map((g) => g.tanggal))]

  const siapa = (p: Pelaku) => (p === 'aku' ? 'Aku' : nama)
  const judul = (g: Gantian) => (g.jenis === 'bayar' ? `${siapa(g.pelaku)} bayar` : g.keterangan)
  const sub = (g: Gantian) =>
    g.jenis === 'bayar' ? 'Pelunasan' : `${siapa(g.pelaku)} yang bayar ${rupiah(g.jumlah)}${g.bagi ? ' · bagi dua' : ''}`
  // Hijau = menambah piutangku, merah = menambah utangku, biru = pelunasan.
  const warna = (g: Gantian) => (g.jenis === 'bayar' ? 'text-upload' : g.pelaku === 'aku' ? 'text-done' : 'text-del')

  const kembali = (
    <Link href="/uang" aria-label="Kembali ke Uang" className="grid size-8 place-items-center rounded-full bg-gray-200 text-muted">
      <ArrowLeft size={16} />
    </Link>
  )

  function catat(g: Gantian | null) {
    setEditing(g)
    setSheet('catat')
  }

  if (!siap) {
    return (
      <>
        <PageHeader title="Gantian" info="gantian" right={kembali} />
        <Empty>Database belum siap. Jalankan supabase/migrations/0009_gantian.sql di Supabase SQL Editor.</Empty>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Gantian" info="gantian" right={kembali} />

      <section className="mx-3 rounded-2xl bg-gradient-to-br from-blue-700 to-violet-500 p-4 text-white shadow-md">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm opacity-85">{items.length ? kalimatSaldo(saldo, nama) : 'Belum ada catatan'}</p>
          <button
            type="button"
            onClick={() => setSheet('nama')}
            aria-label="Ganti nama"
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold"
          >
            <Pencil size={11} aria-hidden="true" /> {nama}
          </button>
        </div>
        <p className="mt-0.5 text-3xl font-bold tabular-nums">{rupiah(Math.abs(saldo))}</p>
      </section>

      <div className="mx-3 mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => catat(null)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-upload font-semibold text-white"
        >
          <Plus size={20} /> Catat
        </button>
        <button
          type="button"
          onClick={() => setSheet('bayar')}
          disabled={saldo === 0}
          className="h-12 rounded-xl bg-done font-semibold text-white disabled:opacity-40"
        >
          Bayar
        </button>
      </div>

      {items.length > 0 && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(rekapGantian(items, nama))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-3 mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-done shadow-sm"
        >
          <Send size={16} /> Kirim rekap ke WA
        </a>
      )}

      <div className="mt-4">
        {items.length === 0 ? (
          <Empty>Tekan Catat untuk talangan pertama.</Empty>
        ) : (
          hari.map((tgl) => (
            <section key={tgl} className="mx-3 mb-3">
              <h2 className="mb-1 px-1 text-xs font-semibold text-muted">{formatTanggal(tgl)}</h2>
              <div className="space-y-1.5">
                {tampil
                  .filter((g) => g.tanggal === tgl)
                  .map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelected(g)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm active:bg-gray-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{judul(g)}</span>
                        <span className="block truncate text-xs text-muted">{sub(g)}</span>
                      </span>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${warna(g)}`}>{rupiah(nilai(g))}</span>
                    </button>
                  ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Pagination page={cur} pages={pages} onChange={setPage} />

      <Sheet open={sheet === 'catat'} title={editing ? 'Edit Catatan' : 'Catat Talangan'} onClose={() => setSheet(null)}>
        <CatatForm
          initial={editing}
          nama={nama}
          today={today}
          onDone={() => {
            setSheet(null)
            setPage(0)
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'bayar'} title="Bayar" onClose={() => setSheet(null)}>
        <BayarForm saldo={saldo} nama={nama} today={today} onDone={() => setSheet(null)} />
      </Sheet>
      <Sheet open={sheet === 'nama'} title="Ganti Nama" onClose={() => setSheet(null)}>
        <NamaForm nama={nama} onDone={() => setSheet(null)} />
      </Sheet>

      <Sheet open={selected !== null} title="Catatan" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className={`text-2xl font-bold tabular-nums ${warna(selected)}`}>{rupiah(nilai(selected))}</p>
              <p className="mt-1 break-words font-medium">{judul(selected)}</p>
              <p className="mt-0.5 text-sm text-muted">
                {sub(selected)} · {formatTanggal(selected.tanggal)}
              </p>
            </div>
            <div className={`grid gap-3 ${selected.jenis === 'talang' ? 'grid-cols-2' : ''}`}>
              {selected.jenis === 'talang' && (
                <button
                  type="button"
                  onClick={() => {
                    const g = selected
                    setSelected(null)
                    catat(g)
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-edit/10 font-semibold text-edit"
                >
                  <Pencil size={17} /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDeleting(selected)
                  setSelected(null)
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-del/10 font-semibold text-del"
              >
                <Trash2 size={17} /> Hapus
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={deleting !== null}
        title="Hapus catatan?"
        message={deleting ? `"${judul(deleting)}" (${rupiah(nilai(deleting))}) akan dihapus permanen dan saldo dihitung ulang.` : ''}
        confirmLabel="Hapus"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && track(deleteGantian(deleting.id), 'Dihapus', 'Menghapus...')}
      />
    </>
  )
}
