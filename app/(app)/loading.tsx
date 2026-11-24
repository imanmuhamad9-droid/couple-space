// Tampil seketika saat pindah menu, selagi data diambil di server.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat" className="animate-pulse px-4 pt-[calc(24px+env(safe-area-inset-top))]">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />
      <div className="mt-5 h-11 rounded-xl bg-gray-200" />
      <div className="mt-6 space-y-3">
        <div className="h-28 rounded-[14px] bg-white" />
        <div className="h-28 rounded-[14px] bg-white" />
        <div className="h-28 rounded-[14px] bg-white" />
      </div>
    </div>
  )
}
