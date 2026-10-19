'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'

type Memory = { id: number, storage_path: string }

export default function MeetingThumbnails({ memories }: { memories: Memory[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  // Ambil maksimal 4 foto
  const displayMemories = memories.slice(0, 4)

  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls: Record<string, string> = {}
      for (const mem of displayMemories) {
        if (!urls[mem.storage_path]) {
          const res = await fetch(`/api/get-image?path=${encodeURIComponent(mem.storage_path)}`)
          const data = await res.json()
          if (data.url) newUrls[mem.storage_path] = data.url
        }
      }
      setUrls(prev => ({ ...prev, ...newUrls }))
    }
    if (displayMemories.length > 0) fetchUrls()
  }, [memories])

  // Kalau belum ada foto sama sekali
  if (memories.length === 0) {
    return (
      <div className="h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 text-xs">
        <ImageIcon size={14} /> Belum ada foto
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {displayMemories.map((mem) => (
        <div key={mem.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
          {urls[mem.storage_path] ? (
            <img src={urls[mem.storage_path]} alt="Thumb" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full animate-pulse bg-gray-200" />
          )}
        </div>
      ))}
      
      {/* Kalau fotonya kurang dari 4, sisanya dikasih kotak kosong biar rapi */}
      {Array.from({ length: 4 - displayMemories.length }).map((_, i) => (
        <div key={`empty-${i}`} className="aspect-square rounded-lg bg-gray-50 border border-gray-100" />
      ))}
    </div>
  )
}