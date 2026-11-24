'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { uploadFoto } from '@/app/actions/foto'
import { useFeedback } from '@/components/Feedback'
import { resizeImage } from '@/lib/image'

/** Resize di browser lalu upload satu per satu. Mengembalikan jumlah yang berhasil. */
export function useUpload() {
  const { track, toast } = useFeedback()
  const router = useRouter()

  return useCallback(
    async (kind: 'kegiatan' | 'tempat', ownerId: string, files: File[]) => {
      let ok = 0
      for (const f of files) {
        const small = await resizeImage(f)
        const form = new FormData()
        form.set('kind', kind)
        form.set('ownerId', ownerId)
        form.set('file', small)
        const r = await track(uploadFoto(form))
        if (r.ok) ok++
        else break // pesan error sudah ditampilkan
      }
      if (ok > 0) toast(ok === 1 ? 'Foto tersimpan' : `${ok} foto tersimpan`)
      router.refresh()
      return ok
    },
    [track, toast, router],
  )
}
