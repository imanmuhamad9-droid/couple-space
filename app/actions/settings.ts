'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  // 1. Tangkap semua data dari form (pakai pengecekan agar aman)
  const partner_a_name = formData.get('partner_a_name') as string
  const partner_b_name = formData.get('partner_b_name') as string
  const anniversary_date = formData.get('anniversary_date') as string
  const theme_color = formData.get('theme_color') as string
  
  // Mood cuma dikirim kalau yang dipanggil adalah MoodTracker
  const mood_a_raw = formData.get('mood_a')
  const mood_b_raw = formData.get('mood_b')
  const mood_a = mood_a_raw ? parseInt(mood_a_raw as string) : undefined
  const mood_b = mood_b_raw ? parseInt(mood_b_raw as string) : undefined

  // 2. Susun data yang mau di-update
  const updateData: any = {}
  
  if (partner_a_name !== null) updateData.partner_a_name = partner_a_name
  if (partner_b_name !== null) updateData.partner_b_name = partner_b_name
  if (anniversary_date !== null) updateData.anniversary_date = anniversary_date || null
  if (theme_color !== null) updateData.theme_color = theme_color || 'blue'
  if (mood_a !== undefined) updateData.mood_a = mood_a
  if (mood_b !== undefined) updateData.mood_b = mood_b

  // 3. Eksekusi ke database
  const { error } = await supabaseAdmin
    .from('settings')
    .update(updateData)
    .eq('id', 1)

  if (error) {
    console.error("Supabase Error:", error.message)
    throw new Error(error.message)
  }
  
  // 4. Refresh halaman biar langsung berubah
  revalidatePath('/settings')
  revalidatePath('/')
}