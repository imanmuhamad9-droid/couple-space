'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon } from 'lucide-react'

export default function MemoryGallery({ initialMemories }: { initialMemories: any[] }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUrls = async () => {
      if (!initialMemories || initialMemories.length === 0) {
        setLoading(false)
        return
      }

      const newUrls: Record<string, string> = {}
      for (const mem of initialMemories) {
        if (!imageUrls[mem.storage_path]) {
          try {
            const res = await fetch(`/api/get-image?path=${encodeURIComponent(mem.storage_path)}`)
            const data = await res.json()
            if (data.url) newUrls[mem.storage_path] = data.url
          } catch (err) {
            console.error("Gagal load gambar", err)
          }
        }
      }
      setImageUrls(prev => ({ ...prev, ...newUrls }))
      setLoading(false)
    }
    fetchUrls()
  }, [initialMemories])

  if (loading) {
    return <div className="text-center py-10 font-bold text-gray-500">Memuat galeri...</div>
  }

  if (!initialMemories || initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <ImageIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload akan muncul di sini.</p>
      </div>
    )
  }

  // Ambil data meeting dengan aman (apapun bentuknya dari Supabase)
  const getMeetingInfo = (mem: any) => {
    if (!mem.meetings) return null
    if (Array.isArray(mem.meetings)) return mem.meetings[0]
    return mem.meetings
  }

  return (
    <div className="space-y-6">
      {/* Grid Foto - Dipaksa pakai Grid CSS Biasa agar pasti muncul */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {initialMemories.map((mem) => {
          const meetingInfo = getMeetingInfo(mem)
          const dateToShow = meetingInfo?.start_at || mem.created_at || new Date().toISOString()
          const displayTitle = meetingInfo?.title || mem.title || 'Tanpa Judul'

          return (
            <div 
              key={mem.id} 
              onClick={() => setSelectedImage(mem)}
              className="relative rounded-2xl overflow-hidden cursor-pointer bg-gray-200 aspect-[3/4] shadow-sm border border-gray-100"
            >
              {imageUrls[mem.storage_path] ? (
                <img 
                  src={imageUrls[mem.storage_path]} 
                  alt={displayTitle} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                   <ImageIcon className="text-gray-400 mb-2" />
                   <span className="text-[10px] text-gray-500 text-center px-2">Gagal Load</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <p className="text-white/80 text-[10px] font-semibold mb-1">
                  {format(new Date(dateToShow), 'dd MMM yyyy', { locale: localeId })}
                </p>
                <h4 className="text-white font-bold text-sm md:text-lg leading-tight line-clamp-2">
                  {displayTitle}
                </h4>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox Zoom */}
      {selectedImage && imageUrls[selectedImage.storage_path] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          
          <img 
            src={imageUrls[selectedImage.storage_path]} 
            alt="Zoomed" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}