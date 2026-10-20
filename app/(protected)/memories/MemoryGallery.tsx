'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon } from 'lucide-react'

type Memory = {
  id: number
  storage_path: string
  caption: string
  title?: string
  created_at: string
  meetings: {
    title: string
    start_at: string
  }[] | null
}

export default function MemoryGallery({ initialMemories }: { initialMemories: Memory[] }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<Memory | null>(null)
  
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls: Record<string, string> = {}
      for (const mem of initialMemories) {
        if (!imageUrls[mem.storage_path]) {
          const res = await fetch(`/api/get-image?path=${encodeURIComponent(mem.storage_path)}`)
          const data = await res.json()
          if (data.url) newUrls[mem.storage_path] = data.url
        }
      }
      setImageUrls(prev => ({ ...prev, ...newUrls }))
    }
    if (initialMemories.length > 0) fetchUrls()
  }, [initialMemories])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    initialMemories.forEach(mem => {
      const meetingInfo = mem.meetings?.[0]
      const dateString = meetingInfo?.start_at || mem.created_at
      
      if (dateString) {
        const yearMonth = String(dateString).substring(0, 7)
        if (yearMonth.includes('-')) months.add(yearMonth)
      }
    })
    return Array.from(months).sort().reverse()
  }, [initialMemories])

  const filteredMemories = useMemo(() => {
    if (selectedMonth === 'all') return initialMemories
    return initialMemories.filter(mem => {
      const meetingInfo = mem.meetings?.[0]
      const dateString = meetingInfo?.start_at || mem.created_at
      if (!dateString) return false
      return String(dateString).substring(0, 7) === selectedMonth
    })
  }, [initialMemories, selectedMonth])

  if (initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <ImageIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload akan muncul di sini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Filter Bulan (Pill Buttons / Kapsul) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
            selectedMonth === 'all'
              ? 'bg-[var(--theme-primary)] text-white shadow-md'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-[var(--theme-primary-light)]'
          }`}
        >
          Semua Foto
        </button>
        
        {availableMonths.map(month => {
          const [year, m] = month.split('-')
          const dateObj = new Date(parseInt(year), parseInt(m) - 1, 1)
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm capitalize ${
                selectedMonth === month
                  ? 'bg-[var(--theme-primary)] text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-[var(--theme-primary-light)]'
              }`}
            >
              {format(dateObj, 'MMMM yyyy', { locale: localeId })}
            </button>
          )
        })}
      </div>

      {/* Grid Masonry */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredMemories.map((mem) => {
          const meetingInfo = mem.meetings?.[0]
          const dateToShow = meetingInfo?.start_at || mem.created_at
          
          // Logika Judul: Ambil dari jadwal, kalau nggak ada ambil dari input manual, kalau nggak ada juga baru "Tanpa Judul"
          const displayTitle = meetingInfo?.title || mem.title || 'Tanpa Judul'

          return (
            <div 
              key={mem.id} 
              onClick={() => setSelectedImage(mem)}
              className="break-inside-avoid relative group rounded-3xl overflow-hidden cursor-pointer bg-gray-100 mb-4 shadow-sm border border-gray-100"
            >
              {imageUrls[mem.storage_path] ? (
                <img 
                  src={imageUrls[mem.storage_path]} 
                  alt={displayTitle} 
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('hidden');
                  }}
                />
              ) : (
                <div className="w-full aspect-[3/4] animate-pulse bg-gray-200" />
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                <p className="text-white/80 text-xs font-semibold mb-1">
                  {format(new Date(dateToShow), 'dd MMMM yyyy', { locale: localeId })}
                </p>
                
                <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">
                  {displayTitle}
                </h4>
                
                {mem.caption && (
                  <p className="text-gray-200 text-sm mt-2 line-clamp-2">"{mem.caption}"</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {selectedImage && imageUrls[selectedImage.storage_path] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          
          <div 
            className="max-w-4xl w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageUrls[selectedImage.storage_path]} 
              alt="Zoomed" 
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl" 
            />
            
            <div className="text-center bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20">
              <h3 className="text-white font-bold text-xl mb-1">
                {selectedImage.meetings?.[0]?.title || selectedImage.title || 'Tanpa Judul'}
              </h3>
              <p className="text-gray-300 text-sm font-medium">
                {format(new Date(selectedImage.meetings?.[0]?.start_at || selectedImage.created_at), 'EEEE, dd MMMM yyyy', { locale: localeId })}
              </p>
              {selectedImage.caption && (
                <div className="mt-3 bg-black/30 px-4 py-2 rounded-xl inline-block">
                  <p className="text-white italic text-sm">"{selectedImage.caption}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}