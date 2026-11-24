'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { uploadFoto } from '@/app/actions/foto'
import { useFeedback } from '@/components/Feedback'
import { resizeImage } from '@/lib/image'

/**
 * Resize di browser lalu upload satu per satu, dengan persen progres.
 * Tiap foto dihitung dua tahap: dikecilkan (0-40%) lalu dikirim (40-100%).
 * Mengembalikan jumlah foto yang berhasil.
 */
export function useUpload() {
  const { track, toast, setProgress } = useFeedback()
  const router = useRouter()

  return useCallback(
    async (kind: 'kegiatan' | 'tempat', ownerId: string, files: File[]) => {
      const total = files.length
      const show = (i: number, stage: number) =>
        setProgress({
          label: total > 1 ? `Mengunggah foto ${i + 1} dari ${total}` : 'Mengunggah foto',
          pct: ((i + stage) / total) * 100,
        })

      let ok = 0
      try {
        for (let i = 0; i < total; i++) {
          show(i, 0)
          const small = await resizeImage(files[i])
          show(i, 0.4)
          const form = new FormData()
          form.set('kind', kind)
          form.set('ownerId', ownerId)
          form.set('file', small)
          const r = await track(uploadFoto(form))
          if (!r.ok) break // pesan error sudah ditampilkan
          ok++
          show(i, 1)
        }
      } finally {
        setProgress(null)
      }
      if (ok > 0) toast(ok === 1 ? 'Foto tersimpan' : `${ok} foto tersimpan`)
      router.refresh()
      return ok
    },
    [track, toast, setProgress, router],
  )
}
