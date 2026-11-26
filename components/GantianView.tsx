'use client'

import { ArrowLeft, Copy, Pencil, Plus, Send, Trash2, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { bayarGantian, deleteGantian, saveNamaGantian, saveTalang } from '@/app/actions/gantian'
import { ITEM_PER_HALAMAN } from '@/lib/constants'
import { angka, formatTanggal, kapitalAwal, rupiah } from '@/lib/format'
import {
  jumlahBarang,
  kalimatSaldo,
  nilai,
  rekapGantian,
  saldoGantian,
  type Barang,
  type Gantian,
  type Pelaku,
  type Punya,
} from '@/lib/gantian'
import type { Dompet } from '@/lib/types'
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
    <div className={`grid gap-2 ${opsi.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

/** Dompet tempat uangku keluar atau masuk. Pilihan kosong = tidak dicatat di Uang. */
function PilihDompet({
  dompet,
  value,
  onChange,
  masuk = false,
}: {
  dompet: Dompet[]
  value: string
  onChange: (id: string) => void
  masuk?: boolean
}) {
  return (
    <div>
      <Field label={masuk ? 'Catat di Uang masuk' : 'Catat di Uang keluar'}>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {dompet.map((d) => (
            <option key={d.id} value={d.id}>
              {masuk ? 'Ke' : 'Dari'} {d.nama}
            </option>
          ))}
          <option value="">Tidak dicatat</option>
        </select>
      </Field>
      <p className="mt-1 text-xs text-muted">Pilih &quot;Tidak dicatat&quot; kalau sudah kamu catat di Uang.</p>
    </div>
  )
}

/** Baris struk selagi diketik: harga masih teks digit. */
type Isian = { key: number; nama: string; harga: string; punya: Punya }

const isianKosong = (key: number): Isian => ({ key, nama: '', harga: '', punya: 'aku' })

function CatatForm({
  initial,
  nama,
  today,
  dompet,
  dompetAwal,
  onDone,
}: {
  initial: Gantian | null
  nama: string
  today: string
  dompet: Dompet[]
  /** Dompet terpilih saat dibuka ('' = tidak dicatat). */
  dompetAwal: string
  onDone: () => void
}) {
  const { track } = useFeedback()
  const [pelaku, setPelaku] = useState<Pelaku>(initial?.pelaku ?? 'aku')
  const [jumlah, setJumlah] = useState(initial ? String(initial.jumlah) : '')
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')
  const [hitung, setHitung] = useState<'penuh' | 'bagi' | 'rinci'>(
    initial?.rincian?.length ? 'rinci' : initial?.bagi ? 'bagi' : 'penuh',
  )
  const [barang, setBarang] = useState<Isian[]>(() =>
    initial?.rincian?.length
      ? initial.rincian.map((b, i) => ({ ...b, key: i, harga: String(b.harga) }))
      : [isianKosong(0)],
  )
  // Total struk hanya diisi bila beda dari jumlah barang (pajak, service, diskon).
  const [totalStruk, setTotalStruk] = useState(() =>
    initial?.rincian?.length && initial.jumlah !== jumlahBarang(initial.rincian) ? String(initial.jumlah) : '',
  )
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? today)
  const [dompetId, setDompetId] = useState(dompetAwal)
  const [busy, setBusy] = useState(false)

  const bagi = hitung === 'bagi'
  const rinci = hitung === 'rinci'
  const berutang = pelaku === 'aku' ? nama : 'Aku'
  const rincian: Barang[] = barang.map((b) => ({ nama: b.nama, harga: Number(b.harga || 0), punya: b.punya }))
  const subtotal = jumlahBarang(rincian)
  const total = rinci ? Number(totalStruk || 0) || subtotal : Number(jumlah || 0)
  const utang = nilai({ jenis: 'talang', jumlah: total, bagi, pelaku, rincian: rinci ? rincian : null })
  const ubah = (key: number, isi: Partial<Isian>) =>
    setBarang((list) => list.map((b) => (b.key === key ? { ...b, ...isi } : b)))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await track(
      saveTalang({
        id: initial?.id,
        tanggal,
        pelaku,
        jumlah: total,
        bagi,
        keterangan,
        rincian: rinci ? rincian : null,
        dompetId: dompet.length ? dompetId || null : undefined,
      }),
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
      <div>
        <p className="mb-1 text-sm font-medium text-muted">Hitungannya</p>
        <Pilihan
          value={hitung}
          onChange={setHitung}
          opsi={[['penuh', 'Penuh'], ['bagi', 'Bagi dua'], ['rinci', 'Struk']]}
        />
      </div>
      <Field label="Untuk apa">
        <input
          required
          maxLength={200}
          value={keterangan}
          onChange={(e) => setKeterangan(kapitalAwal(e.target.value))}
          placeholder={rinci ? 'Contoh: Struk restoran' : 'Contoh: Makan malam'}
          className={inputCls}
        />
      </Field>

      {rinci ? (
        <>
          {barang.map((b, i) => (
            <div key={b.key} className="space-y-2 rounded-2xl border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Barang {i + 1}</p>
                {barang.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBarang((list) => list.filter((x) => x.key !== b.key))}
                    aria-label={`Hapus barang ${i + 1}`}
                    className="grid size-8 place-items-center rounded-full bg-del/10 text-del"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <Field label="Nama barang">
                <input
                  required
                  maxLength={100}
                  value={b.nama}
                  onChange={(e) => ubah(b.key, { nama: kapitalAwal(e.target.value) })}
                  className={inputCls}
                />
              </Field>
              <InputRupiah label="Harga (Rp)" value={b.harga} onChange={(harga) => ubah(b.key, { harga })} />
              <div>
                <p className="mb-1 text-sm font-medium text-muted">Punya siapa</p>
                <Pilihan
                  value={b.punya}
                  onChange={(punya) => ubah(b.key, { punya })}
                  opsi={[['aku', 'Aku'], ['dia', nama], ['berdua', 'Berdua']]}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBarang((list) => [...list, isianKosong(Math.max(...list.map((x) => x.key)) + 1)])}
            disabled={barang.length >= 50}
            className="h-11 w-full rounded-xl border border-dashed border-line text-sm font-semibold text-upload"
          >
            + Barang lain
          </button>
          <div>
            <Field label="Total di struk (Rp)">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={totalStruk ? angka(Number(totalStruk)) : ''}
                onChange={(e) => setTotalStruk(e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder={subtotal ? angka(subtotal) : '0'}
                className={inputCls}
              />
            </Field>
            <p className="mt-1 text-xs text-muted">Isi kalau ada pajak, service, atau diskon.</p>
          </div>
          {subtotal > 0 && (
            <dl className="space-y-1 rounded-xl bg-gray-100 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jumlah barang</dt>
                <dd className="tabular-nums">{rupiah(subtotal)}</dd>
              </div>
              {total !== subtotal && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{total > subtotal ? 'Pajak / service' : 'Diskon'}</dt>
                  <dd className="tabular-nums">{rupiah(Math.abs(total - subtotal))}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Total dibayar</dt>
                <dd className="tabular-nums">{rupiah(total)}</dd>
              </div>
              <div className="flex justify-between gap-3 font-semibold">
                <dt>{berutang} berutang</dt>
                <dd className="tabular-nums">{rupiah(utang)}</dd>
              </div>
            </dl>
          )}
        </>
      ) : (
        <div>
          <InputRupiah label="Jumlah (Rp)" value={jumlah} onChange={setJumlah} />
          {jumlah !== '' && (
            <p className="mt-1 text-xs text-muted">
              {berutang} berutang {rupiah(utang)}
            </p>
          )}
        </div>
      )}
      {pelaku === 'aku' && dompet.length > 0 && <PilihDompet dompet={dompet} value={dompetId} onChange={setDompetId} />}
      <PickerField label="Tanggal" type="date" required value={tanggal} onChange={setTanggal} />
      <SubmitButton busy={busy}>{initial ? 'Simpan perubahan' : 'Simpan'}</SubmitButton>
    </form>
  )
}

function BayarForm({
  saldo,
  nama,
  today,
  dompet,
  onDone,
}: {
  saldo: number
  nama: string
  today: string
  dompet: Dompet[]
  onDone: () => void
}) {
  const [dompetId, setDompetId] = useState(dompet[0]?.id ?? '')
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
      bayarGantian({
        tanggal,
        pelaku: saldo > 0 ? 'dia' : 'aku',
        jumlah: Number(jumlah || 0),
        dompetId: dompet.length ? dompetId || null : undefined,
      }),
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
      <p className={`text-xs ${sisa < 0 ? 'text-del' : 'text-muted'}`}>
        {sisa < 0
          ? 'Melebihi yang harus dibayar.'
          : sisa === 0
            ? 'Bayar semua: setelah ini impas.'
            : jumlah
              ? `Bayar sebagian: sisa ${rupiah(sisa)} tetap tercatat.`
              : 'Isi nominal yang dibayar.'}
      </p>
      {dompet.length > 0 && <PilihDompet dompet={dompet} value={dompetId} onChange={setDompetId} masuk={saldo > 0} />}
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
  dompet,
  asal,
}: {
  siap: boolean
  nama: string
  items: Gantian[]
  today: string
  /** Kosong = pencatatan ke Uang belum siap (migrasi 0012). */
  dompet: Dompet[]
  /** id catatan gantian -> id dompet pengeluarannya. */
  asal: Record<string, string>
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
    g.jenis === 'bayar'
      ? 'Pelunasan'
      : `${siapa(g.pelaku)} yang bayar ${rupiah(g.jumlah)}${g.bagi ? ' · bagi dua' : g.rincian?.length ? ' · struk' : ''}`
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

      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => catat(null)} className="flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold bg-upload text-white">
          <Plus size={18} /> Catat
        </button>
        <button
          type="button"
          onClick={() => setSheet('bayar')}
          disabled={saldo === 0}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold bg-done text-white disabled:opacity-40"
        >
          <Wallet size={17} /> Bayar
        </button>
        <a
          href={items.length ? `https://wa.me/?text=${encodeURIComponent(rekapGantian(items, nama))}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Kirim rekap ke WhatsApp"
          aria-disabled={items.length === 0}
          className={`flex h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold bg-white text-done shadow-sm ${items.length ? '' : 'opacity-40'}`}
        >
          <Send size={16} /> Rekap WA
        </a>
      </div>

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
          dompet={dompet}
          dompetAwal={editing ? (asal[editing.id] ?? '') : (dompet[0]?.id ?? '')}
          onDone={() => {
            setSheet(null)
            setPage(0)
          }}
        />
      </Sheet>
      <Sheet open={sheet === 'bayar'} title="Bayar" onClose={() => setSheet(null)}>
        <BayarForm saldo={saldo} nama={nama} today={today} dompet={dompet} onDone={() => setSheet(null)} />
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
              <dl className="mt-3 divide-y divide-line text-sm">
                {(
                  [
                    ['Tanggal', formatTanggal(selected.tanggal)],
                    ['Yang bayar', siapa(selected.pelaku)],
                    ...(selected.jenis === 'talang'
                      ? [
                          ['Total', rupiah(selected.jumlah)],
                          ['Hitungan', selected.rincian?.length ? 'Struk' : selected.bagi ? 'Bagi dua' : 'Penuh'],
                        ]
                      : [['Jenis', 'Pelunasan']]),
                  ] as string[][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-1.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              {!!selected.rincian?.length && (
                <ul className="mt-3 space-y-2 rounded-xl bg-gray-100 p-3 text-sm">
                  {selected.rincian.map((b, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block break-words font-medium">{b.nama}</span>
                        <span className="block text-xs text-muted">{b.punya === 'berdua' ? 'Berdua' : siapa(b.punya)}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{rupiah(b.harga)}</span>
                    </li>
                  ))}
                </ul>
              )}
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
        message={deleting ? `"${judul(deleting)}" (${rupiah(nilai(deleting))}) akan dihapus permanen dan saldo dihitung ulang.${asal[deleting.id] ? ' Catatannya di Uang ikut dihapus.' : ''}` : ''}
        confirmLabel="Hapus"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && track(deleteGantian(deleting.id), 'Dihapus', 'Menghapus...')}
      />
    </>
  )
}
