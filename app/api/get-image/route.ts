import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 })

  // Kalau dari luar (Google/Unsplash), langsung balikin URL-nya
  if (path.startsWith('http')) {
    return NextResponse.json({ url: path })
  }

  // Ambil Public URL dari Supabase
  const { data } = supabaseAdmin.storage
    .from('memories')
    .getPublicUrl(path)

  return NextResponse.json({ url: data.publicUrl })
}