import { supabaseAdmin } from '@/lib/supabase-admin'
import MemoryGallery from './MemoryGallery'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MemoriesPage() {
  // Tarik data dari Supabase
  const { data: memories, error } = await supabaseAdmin
    .from('memories')
    .select('*') // Ambil semua kolom untuk memastikan tidak ada error relasi
    .order('created_at', { ascending: false })

  // Jika Supabase gagal, tampilkan error merah di layar
  if (error) {
    return (
      <div className="p-10 bg-red-100 text-red-800 rounded-xl border border-red-300">
        <h2 className="text-xl font-bold mb-2">Gagal Memuat Data dari Supabase!</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  // Jika data kosong
  if (!memories || memories.length === 0) {
    return (
      <div className="p-10 bg-yellow-100 text-yellow-800 rounded-xl border border-yellow-300 text-center">
        <h2 className="text-xl font-bold mb-2">Database Kosong</h2>
        <p>Supabase terhubung, tapi tidak ada data di tabel memories.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 font-slab">Galeri Kita</h2>
          <p className="text-gray-500 font-medium mt-1 text-sm md:text-lg">Liat ini semua momen indah yang kita lalui berdua...</p>
        </div>
        
        <Link 
          href="/memories/upload" 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:scale-105 transition-transform shadow-md w-fit"
        >
          <Plus size={18} /> Upload Foto
        </Link>
      </div>

      {/* Kirim data ke komponen Galeri */}
      <MemoryGallery initialMemories={memories} />
    </div>
  )
}