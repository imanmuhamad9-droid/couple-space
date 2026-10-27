import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 })

  // Kalau dari luar (Google/Unsplash), langsung balikin URL-nya
  if (path.startsWith('http')) {
    return NextResponse.json({ url: path })
  }

  // Ambil URL langsung dari Supabase menggunakan variabel env publik
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Paksa ambil Public URL
  const { data } = supabase.storage.from('memories').getPublicUrl(path)

  return NextResponse.json({ url: data.publicUrl })
}