'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

// 1. FUNGSI UNTUK MENYIMPAN PENGATURAN (Nama, Tanggal, Tema, Mood)
export async function updateSettings(formData: FormData) {
  const partner_a_name = formData.get('partner_a_name') as string
  const partner_b_name = formData.get('partner_b_name') as string
  const anniversary_date = formData.get('anniversary_date') as string
  const theme_color = formData.get('theme_color') as string
  const mood_a = formData.get('mood_a')
  const mood_b = formData.get('mood_b')

  const updates: any = {}
  if (partner_a_name !== null) updates.partner_a_name = partner_a_name
  if (partner_b_name !== null) updates.partner_b_name = partner_b_name
  if (anniversary_date) updates.anniversary_date = anniversary_date
  if (theme_color) updates.theme_color = theme_color
  if (mood_a) updates.mood_a = parseInt(mood_a as string)
  if (mood_b) updates.mood_b = parseInt(mood_b as string)

  const { error } = await supabaseAdmin
    .from('settings')
    .update(updates)
    .eq('id', 1)

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings')
  revalidatePath('/')
}

// 2. FUNGSI UPLOAD FOTO (Langsung terima File, paksa .jpg, dan pakai Buffer)
export async function updateAvatarDirectly(file: File, partner: string) {
  if (!file || file.size === 0) throw new Error('File foto kosong atau tidak terbaca.')

  // Paksa nama dan ekstensi jadi .jpg agar 100% kompatibel
  const fileName = `avatar-${partner}-${Date.now()}.jpg`
  const filePath = `${fileName}`

  // Ubah File menjadi Buffer (Cara paling aman di Next.js Server Action)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath)

  const updateField = partner === 'a' ? 'partner_a_avatar' : 'partner_b_avatar'
  
  const { error: dbError } = await supabaseAdmin
    .from('settings')
    .update({ [updateField]: urlData.publicUrl })
    .eq('id', 1)

  if (dbError) throw new Error(dbError.message)

  revalidatePath('/settings')
  revalidatePath('/')
}