import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 })

  // Cek apakah path ini sudah berupa URL lengkap (dari Google/Unsplash)
  if (path.startsWith('http')) {
    return NextResponse.json({ url: path })
  }

  // Kalau bukan URL, berarti file ada di Supabase Storage (ambil signed URL)
  const { data, error } = await supabaseAdmin.storage
    .from('memories')
    .createSignedUrl(path, 3600)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ url: data.signedUrl })
}