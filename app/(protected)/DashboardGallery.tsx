'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

type Memory = {
  id: number
  storage_path: string
}

export default function DashboardGallery({ memories }: { memories: Memory[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [urls, setUrls] = useState<Record<string, string>>({})

  // Ambil URL gambar
  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls: Record<string, string> = {}
      for (const mem of memories) {
        if (!urls[mem.storage_path]) {
          const res = await fetch(`/api/get-image?path=${encodeURIComponent(mem.storage_path)}`)
          const data = await res.json()
          if (data.url) newUrls[mem.storage_path] = data.url
        }
      }
      setUrls(prev => ({ ...prev, ...newUrls }))
    }
    if (memories.length > 0) fetchUrls()
  }, [memories])

  // Auto-slide setiap 3 detik
  useEffect(() => {
    if (memories.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [memories.length])

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
        <ImageIcon size={24} className="text-gray-300 mb-2" />
        <span className="text-gray-400 text-sm">Belum ada foto</span>
      </div>
    )
  }

  const currentMem = memories[currentIndex]
  const currentUrl = urls[currentMem.storage_path]

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden group bg-gray-100">
      {currentUrl ? (
        <img 
          src={currentUrl} 
          alt="Recent" 
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-200"></div>
      )}
      
      {/* Tombol Navigasi Manual (muncul saat hover) */}
      {memories.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % memories.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
      
      {/* Indikator Titik-titik */}
      {memories.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {memories.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`} 
            />
          ))}
        </div>
      )}
    </div>
  )
}