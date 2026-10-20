'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const partner_a_name = formData.get('partner_a_name') as string
  const partner_b_name = formData.get('partner_b_name') as string
  const anniversary_date = formData.get('anniversary_date') as string
  const theme_color = formData.get('theme_color') as string

  const { error } = await supabaseAdmin
    .from('settings')
    .update({
      partner_a_name,
      partner_b_name,
      anniversary_date: anniversary_date || null,
      theme_color: theme_color || 'blue', // <-- Tambahan untuk simpan warna
    })
    .eq('id', 1)

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings')
  revalidatePath('/')
}