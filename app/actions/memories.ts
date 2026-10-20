'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function uploadManualMemories(formData: FormData) {
  const files = formData.getAll('files') as File[]
  const caption = formData.get('caption') as string
  
  if (!files || files.length === 0) throw new Error('Pilih minimal satu foto.')

  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `manual-upload/${fileName}` // Folder khusus manual upload

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, file)

    if (uploadError) throw new Error(uploadError.message)

    // Simpan ke database tanpa meeting_id (NULL)
    const { error: dbError } = await supabaseAdmin.from('memories').insert({
      media_type: 'photo',
      storage_path: filePath,
      caption: caption,
    })

    if (dbError) throw new Error(dbError.message)
  })

  await Promise.all(uploadPromises)
  revalidatePath('/memories')
  revalidatePath('/')
}