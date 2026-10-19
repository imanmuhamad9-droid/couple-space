'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon, Calendar, Filter } from 'lucide-react'

type Memory = {
  id: number
  storage_path: string
  caption: string
  created_at: string // Kita pakai tanggal upload foto
  meetings: {
    title: string
    start_at: string
  }[] | null
}

export default function MemoryGallery({ initialMemories }: { initialMemories: Memory[] }) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [selectedImage, setSelectedImage] = useState<Memory | null>(null)
  
  // State untuk filter
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

  // LOGIKA BARU: Mengambil bulan dari `created_at` (Tanggal Upload)
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    initialMemories.forEach(mem => {
      if (mem.created_at) {
        // Ambil 7 karakter pertama (YYYY-MM)
        const yearMonth = String(mem.created_at).substring(0, 7)
        if (yearMonth.includes('-')) months.add(yearMonth)
      }
    })
    return Array.from(months).sort().reverse()
  }, [initialMemories])

  // Filter berdasarkan bulan upload
  const filteredMemories = useMemo(() => {
    if (selectedMonth === 'all') return initialMemories
    return initialMemories.filter(mem => {
      if (!mem.created_at) return false
      return String(mem.created_at).substring(0, 7) === selectedMonth
    })
  }, [initialMemories, selectedMonth])

  if (initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-blue-200">
        <ImageIcon size={48} className="text-blue-200 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload di halaman Meetings akan muncul di sini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* TAMPILAN FILTER BARU (TOMBOL BULAT) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
            selectedMonth === 'all'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-blue-50'
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
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm capitalize ${
                selectedMonth === month
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-blue-50'
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

          return (
            <div 
              key={mem.id} 
              onClick={() => setSelectedImage(mem)}
              className="break-inside-avoid relative group rounded-3xl overflow-hidden cursor-pointer bg-blue-50 min-h-[100px] shadow-sm border border-blue-100/50"
            >
              {imageUrls[mem.storage_path] ? (
                <img 
                  src={imageUrls[mem.storage_path]} 
                  alt="Memory" 
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('hidden');
                  }}
                />
              ) : (
                <div className="w-full aspect-square animate-pulse bg-blue-100" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-bold text-sm line-clamp-2">{meetingInfo?.title || 'Tanpa Judul'}</p>
                {meetingInfo?.start_at && (
                  <p className="text-blue-200 text-xs font-medium mt-1">
                    {format(new Date(meetingInfo.start_at), 'dd MMM yyyy', { locale: localeId })}
                  </p>
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
                {selectedImage.meetings?.[0]?.title || 'Tanpa Judul'}
              </h3>
              {selectedImage.meetings?.[0]?.start_at && (
                <p className="text-blue-200 text-sm font-medium">
                  {format(new Date(selectedImage.meetings[0].start_at), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                </p>
              )}
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