'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon, Calendar } from 'lucide-react'

type Memory = {
  id: number
  storage_path: string
  caption: string
  created_at: string
  meetings: {
    title: string
    start_at: string
  }[] | null // Kita set sebagai Array
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
      // Kita ambil data pertama dari array meetings
      const meetingInfo = mem.meetings?.[0]
      if (meetingInfo?.start_at) {
        months.add(format(parseISO(meetingInfo.start_at), 'yyyy-MM'))
      }
    })
    return Array.from(months).sort().reverse()
  }, [initialMemories])

  const filteredMemories = useMemo(() => {
    if (selectedMonth === 'all') return initialMemories
    return initialMemories.filter(mem => {
      const meetingInfo = mem.meetings?.[0]
      if (!meetingInfo?.start_at) return false
      return format(parseISO(meetingInfo.start_at), 'yyyy-MM') === selectedMonth
    })
  }, [initialMemories, selectedMonth])

  if (initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <ImageIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload di halaman Meetings akan muncul di sini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit">
        <Calendar size={18} className="text-gray-500 ml-2" />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-4"
        >
          <option value="all">Semua Bulan</option>
          {availableMonths.map(month => (
            <option key={month} value={month}>
              {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: localeId })}
            </option>
          ))}
        </select>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredMemories.map((mem) => {
          // Ambil info meeting pertama untuk ditampilkan
          const meetingInfo = mem.meetings?.[0]

          return (
            <div 
              key={mem.id} 
              onClick={() => setSelectedImage(mem)}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer bg-gray-100 min-h-[100px]"
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
                <div className="w-full aspect-square animate-pulse bg-gray-200" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-medium text-sm line-clamp-2">{meetingInfo?.title || 'Tanpa Judul'}</p>
                {meetingInfo && (
                  <p className="text-gray-300 text-xs mt-1">
                    {format(new Date(meetingInfo.start_at), 'dd MMM yyyy', { locale: localeId })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedImage && imageUrls[selectedImage.storage_path] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors"
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
              className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl" 
            />
            
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">
                {selectedImage.meetings?.[0]?.title || 'Tanpa Judul'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {selectedImage.meetings?.[0] && format(new Date(selectedImage.meetings[0].start_at), 'EEEE, dd MMMM yyyy', { locale: localeId })}
              </p>
              {selectedImage.caption && (
                <div className="mt-3 bg-white/10 px-4 py-2 rounded-lg inline-block">
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