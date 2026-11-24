'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-24 text-center">
      <h1 className="text-xl font-bold">Gagal memuat data</h1>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button type="button" onClick={reset} className="mt-5 h-11 rounded-xl bg-upload px-6 font-semibold text-white">
        Coba lagi
      </button>
    </div>
  )
}
