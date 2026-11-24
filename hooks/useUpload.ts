'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { uploadFoto } from '@/app/actions/foto'
import { useFeedback } from '@/components/Feedback'
import { PDF_MAX_BYTES } from '@/lib/constants'
import { resizeImage } from '@/lib/image'

const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)

/**
 * Upload satu per satu dengan persen progres. Foto dikecilkan dulu di browser; PDF dikirim apa adanya
 * (maks 4 MB). Tiap file dihitung dua tahap: disiapkan (0-40%) lalu dikirim (40-100%).
 * Mengembalikan jumlah file yang berhasil.
 */
export function useUpload() {
  const { track, toast, setProgress } = useFeedback()
  const router = useRouter()

  return useCallback(
    async (kind: 'kegiatan' | 'tempat', ownerId: string, files: File[]) => {
      const total = files.length
      const noun = files.some(isPdf) ? 'file' : 'foto'
      const show = (i: number, stage: number) =>
        setProgress({
          label: total > 1 ? `Mengunggah ${noun} ${i + 1} dari ${total}` : `Mengunggah ${noun}`,
          pct: ((i + stage) / total) * 100,
        })

      let ok = 0
      try {
        for (let i = 0; i < total; i++) {
          const original = files[i]
          show(i, 0)

          if (isPdf(original) && original.size > PDF_MAX_BYTES) {
            toast(`"${original.name}" terlalu besar. PDF maksimal 4 MB.`)
            continue
          }

          const form = new FormData()
          form.set('kind', kind)
          form.set('ownerId', ownerId)
          if (isPdf(original)) {
            form.set('file', original)
            form.set('nama', original.name)
          } else {
            form.set('file', await resizeImage(original))
          }
          show(i, 0.4)

          const r = await track(uploadFoto(form))
          if (!r.ok) break // pesan error sudah ditampilkan
          ok++
          show(i, 1)
        }
      } finally {
        setProgress(null)
      }
      if (ok > 0) toast(ok === 1 ? `${noun === 'file' ? 'File' : 'Foto'} tersimpan` : `${ok} ${noun} tersimpan`)
      router.refresh()
      return ok
    },
    [track, toast, setProgress, router],
  )
}
