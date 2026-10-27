'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import imageCompression from 'browser-image-compression'

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

// 3. DELETE
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

// 5. UPLOAD MEMORIES (DARI JADWAL)
export async function uploadMemories(meetingId: number, formData: FormData) {
  const files = formData.getAll('files') as File[]
  const caption = formData.get('caption') as string
  
  if (!files || files.length === 0) {
    throw new Error('Pilih minimal satu foto.')
  }

  const uploadPromises = files.map(async (file) => {
    // --- PROSES KOMPRESI GAMBAR ---
    const options = {
      maxSizeMB: 1, // Maksimal 1MB (biar ringan di HP)
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' // Paksa jadi JPEG (buat jaga-jaga kalau dari iPhone/HEIC)
    }

    let fileToUpload = file
    try {
      fileToUpload = await imageCompression(file, options)
    } catch (error) {
      console.log("Gagal kompresi, pakai file asli", error)
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `meeting-${meetingId}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, fileToUpload, {
        contentType: 'image/jpeg',
      })

    if (uploadError) throw new Error(uploadError.message)

    const { error: dbError } = await supabaseAdmin.from('memories').insert({
      meeting_id: meetingId,
      media_type: 'photo',
      storage_path: filePath,
      caption: caption,
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

  const uploadPromises = files.map(async (file) => {
    // --- PROSES KOMPRESI GAMBAR ---
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg'
    }

    let fileToUpload = file
    try {
      fileToUpload = await imageCompression(file, options)
    } catch (error) {
      console.log("Gagal kompresi, pakai file asli", error)
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `manual-upload/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('memories')
      .upload(filePath, fileToUpload, {
        contentType: 'image/jpeg',
      })

    if (uploadError) throw new Error(uploadError.message)

    const { error: dbError } = await supabaseAdmin.from('memories').insert({
      media_type: 'photo',
      storage_path: filePath,
      caption: caption,
      title: title || 'Kenangan Manis',
      created_at: manualDate ? new Date(manualDate).toISOString() : new Date().toISOString(),
    })

    if (dbError) throw new Error(dbError.message)
  })

  await Promise.all(uploadPromises)
  revalidatePath('/memories')
  revalidatePath('/')
}