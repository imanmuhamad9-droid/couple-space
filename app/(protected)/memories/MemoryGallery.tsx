'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon } from 'lucide-react'

export default function MemoryGallery({ initialMemories }: { initialMemories: any[] }) {
  const [selectedImage, setSelectedImage] = useState<any | null>(null)

  if (!initialMemories || initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <ImageIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload akan muncul di sini.</p>
      </div>
    )
  }

  const getMeetingInfo = (mem: any) => {
    if (!mem.meetings) return null
    if (Array.isArray(mem.meetings)) return mem.meetings[0]
    return mem.meetings
  }

  const getImageUrl = (path: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return ''
    }
    const baseUrl = supabaseUrl.replace(/\/$/, '')
    return `${baseUrl}/storage/v1/object/public/memories/${path}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {initialMemories.map((mem) => {
          const meetingInfo = getMeetingInfo(mem)
          const dateToShow = meetingInfo?.start_at || mem.created_at || new Date().toISOString()
          const displayTitle = meetingInfo?.title || mem.title || 'Tanpa Judul'
          const imageUrl = getImageUrl(mem.storage_path)

          return (
            <div 
              key={mem.id} 
              onClick={() => setSelectedImage({ ...mem, imageUrl })}
              className="relative rounded-2xl overflow-hidden cursor-pointer bg-gray-200 aspect-[3/4] shadow-sm border border-gray-100"
            >
              <img 
                src={imageUrl} 
                alt={displayTitle} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // PERBAIKAN TYPESCRIPT DI SINI
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/400x600?text=Foto+Rusak';
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
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
      {selectedImage && (
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
            src={selectedImage.imageUrl} 
            alt="Zoomed" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}