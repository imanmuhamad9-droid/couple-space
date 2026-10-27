'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

// 1. CREATE (Tambah Jadwal)
export async function addMeeting(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const start_at = formData.get('start_at') as string
  const end_at = formData.get('end_at') as string
  const notes = formData.get('notes') as string

  const { error } = await supabaseAdmin.from('meetings').insert({
    title, description, location,
    start_at: new Date(start_at).toISOString(),
    end_at: end_at ? new Date(end_at).toISOString() : null,
    notes,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/meetings')
  revalidatePath('/')
}

// 2. UPDATE (Edit Jadwal)
export async function updateMeeting(id: number, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const start_at = formData.get('start_at') as string
  const end_at = formData.get('end_at') as string
  const status = formData.get('status') as string
  const notes = formData.get('notes') as string

  const { error } = await supabaseAdmin
    .from('meetings')
    .update({
      title, description, location,
      start_at: new Date(start_at).toISOString(),
      end_at: end_at ? new Date(end_at).toISOString() : null,
      status, notes,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/meetings')
  revalidatePath('/')
}

// 3. DELETE JADWAL
export async function deleteMeeting(id: number) {
  const { error } = await supabaseAdmin.from('meetings').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/meetings')
  revalidatePath('/')
}

// 4. TANDAI SELESAI
export async function markMeetingDone(id: number) {
  const { error } = await supabaseAdmin
    .from('meetings')
    .update({ status: 'done' })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/meetings')
  revalidatePath('/')
}

// 5. UPLOAD MEMORIES DARI JADWAL (Diperbaiki)
export async function uploadMemories(meetingId: number, formData: FormData) {
  const files = formData.getAll('files') as File[]
  const caption = formData.get('caption') as string
  
  if (!files || files.length === 0) {
    throw new Error('Pilih minimal satu foto.')
  }

  // Ambil data jadwal aslinya untuk mendapatkan Judul dan Tanggal
  const { data: meeting, error: meetingError } = await supabaseAdmin
    .from('meetings')
    .select('title, start_at')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    throw new Error('Jadwal tidak ditemukan.')
  }

  const uploadPromises = files.map(async (file) => {
    let fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || fileExt === 'undefined' || fileExt === 'heic' || fileExt === 'heif') {
      fileExt = 'jpg'
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `meeting-${meetingId}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, file, { contentType: file.type || 'image/jpeg' })

    if (uploadError) throw new Error(uploadError.message)

    const { error: dbError } = await supabaseAdmin.from('memories').insert({
      meeting_id: meetingId,
      media_type: 'photo',
      storage_path: filePath,
      caption: caption,
      title: meeting.title, // <-- Simpan judul dari jadwal
      created_at: meeting.start_at, // <-- Simpan tanggal jadwal (1 Okt)
    })

    if (dbError) throw new Error(dbError.message)
    return filePath
  })

  await Promise.all(uploadPromises)

  const { error: updateError } = await supabaseAdmin
    .from('meetings')
    .update({ status: 'done' })
    .eq('id', meetingId)

  if (updateError) throw new Error(updateError.message)
  revalidatePath('/meetings')
  revalidatePath('/')
  revalidatePath('/memories') // Refresh halaman memori
}

// 6. UPLOAD MANUAL DARI GALERI
export async function uploadManualMemories(formData: FormData) {
  const files = formData.getAll('files') as File[]
  const caption = formData.get('caption') as string
  const manualDate = formData.get('manual_date') as string
  const title = formData.get('title') as string 
  
  if (!files || files.length === 0) {
    throw new Error('Pilih minimal satu foto.')
  }

  const now = manualDate ? new Date(manualDate).toISOString() : new Date().toISOString()

  const uploadPromises = files.map(async (file) => {
    let fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || fileExt === 'undefined' || fileExt === 'heic' || fileExt === 'heif') {
      fileExt = 'jpg'
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `manual-upload/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, file, { contentType: file.type || 'image/jpeg' })

    if (uploadError) throw new Error(uploadError.message)

    const { error: dbError } = await supabaseAdmin.from('memories').insert({
      media_type: 'photo',
      storage_path: filePath,
      caption: caption,
      title: title || 'Kenangan Manis',
      created_at: now,
    })

    if (dbError) throw new Error(dbError.message)
  })

  await Promise.all(uploadPromises)
  revalidatePath('/memories')
  revalidatePath('/')
}

// 7. HAPUS FOTO MEMORI
export async function deleteMemory(id: number, storagePath: string) {
  const { error: storageError } = await supabaseAdmin.storage
    .from('memories')
    .remove([storagePath])

  if (storageError) throw new Error(storageError.message)

  const { error: dbError } = await supabaseAdmin
    .from('memories')
    .delete()
    .eq('id', id)

  if (dbError) throw new Error(dbError.message)

  revalidatePath('/memories')
  revalidatePath('/')
}