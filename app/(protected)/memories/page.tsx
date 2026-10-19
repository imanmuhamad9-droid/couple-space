import { supabaseAdmin } from '@/lib/supabase-admin'
import MemoryGallery from './MemoryGallery'

export const instant = false

export default async function MemoriesPage() {
  // Kita pastikan relasi 'meetings' benar-benar diambil
  const { data: memories, error } = await supabaseAdmin
    .from('memories')
    .select(`
      id,
      storage_path,
      caption,
      created_at,
      meetings (
        title,
        start_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Gagal memuat memori: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-gray-800">Galeri Kenangan</h2>
        <p className="text-gray-500">Semua momen indah yang pernah kita lewati.</p>
      </header>

      <MemoryGallery initialMemories={memories || []} />
    </div>
  )
}