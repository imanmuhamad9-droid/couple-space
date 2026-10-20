import { supabaseAdmin } from '@/lib/supabase-admin'
import MemoryGallery from './MemoryGallery'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const instant = false

export default async function MemoriesPage() {
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
      {/* Header dengan Tombol Upload */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Galeri Kenangan</h2>
          <p className="text-gray-500 font-medium mt-1">Semua momen indah yang pernah kita lewati.</p>
        </div>
        
        <Link 
          href="/memories/upload" 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:scale-105 transition-transform shadow-md w-fit"
        >
          <Plus size={18} /> Upload Foto
        </Link>
      </div>

      <MemoryGallery initialMemories={memories || []} />
    </div>
  )
}