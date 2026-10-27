'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { X, Image as ImageIcon, Trash2, Loader2, Images, ChevronRight, ChevronLeft, Trash } from 'lucide-react'
import { deleteMemory } from '@/app/actions/meetings'

export default function MemoryGallery({ initialMemories }: { initialMemories: any[] }) {
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8 // Jumlah grup per halaman

  if (!initialMemories || initialMemories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
        <ImageIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Belum ada kenangan</h3>
        <p className="text-sm text-gray-500">Foto yang kamu upload akan muncul di sini.</p>
      </div>
    )
  }

  const getImageUrl = (path: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || !path) return ''
    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/memories/${encodeURIComponent(path)}`
  }

  // Grouping berdasarkan Judul
  const groupedMemories = initialMemories.reduce((acc: any[], current: any) => {
    const groupTitle = current?.title || 'Tanpa Judul'
    const existingGroup = acc.find(group => group.title === groupTitle)

    if (existingGroup) {
      existingGroup.photos.push(current)
    } else {
      acc.push({ 
        id: current?.id || Math.random(),
        title: groupTitle,
        caption: current?.caption || '',
        created_at: current?.created_at || new Date().toISOString(),
        photos: [current] 
      })
    }
    return acc
  }, [])

  // LOGIKA PAGINATION
  const totalPages = Math.ceil(groupedMemories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGroups = groupedMemories.slice(startIndex, startIndex + itemsPerPage)

  const handleDeletePhoto = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const mem = initialMemories.find(m => m.id === deleteId)
      if (mem) await deleteMemory(mem.id, mem.storage_path)
      setDeleteId(null)
      
      if (selectedGroup) {
        const remainingPhotos = selectedGroup.photos.filter((p: any) => p.id !== deleteId)
        if (remainingPhotos.length === 0) setSelectedGroup(null)
        else setSelectedGroup({ ...selectedGroup, photos: remainingPhotos })
      }
    } catch (error) {
      alert('Gagal menghapus foto')
    } finally {
      setIsDeleting(false)
    }
  }

  // Hapus Semua Foto dalam 1 Grup (Kolom)
  const handleDeleteGroup = async (group: any) => {
    setIsDeleting(true)
    try {
      for (const photo of group.photos) {
        await deleteMemory(photo.id, photo.storage_path)
      }
      setDeleteGroupId(null)
    } catch (error) {
      alert('Gagal menghapus grup foto')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* TAMPILAN PINTEREST (Masonry CSS) */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {paginatedGroups.map((group, index) => {
          let formattedDate = 'Tanggal tidak valid'
          try {
            if (group.created_at) formattedDate = format(new Date(group.created_at), 'dd MMM yyyy', { locale: localeId })
          } catch (e) {}

          const totalPhotos = group.photos.length
          const isSinglePhoto = totalPhotos === 1

          // Jika lebih dari 1 foto, paksa jadi Grid Kotak
          let gridClass = ""
          if (!isSinglePhoto) {
            gridClass = "grid gap-2 grid-cols-2"
          }

          return (
            <div key={`${group.title}-${index}`} className="break-inside-avoid bg-white p-3 rounded-3xl border border-gray-100 shadow-sm relative">
              
              {/* Header Grup */}
              <div className="flex justify-between items-start mb-3 px-1">
                <div 
                  className="cursor-pointer group/header"
                  onClick={() => setSelectedGroup(group)}
                >
                  <p className="text-xs font-bold text-gray-400">{formattedDate}</p>
                  <h4 className="font-bold text-gray-800 text-lg group-hover/header:text-blue-600 transition-colors flex items-center gap-1">
                    {group.title} <ChevronRight size={18} />
                  </h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Images size={12} /> {totalPhotos}
                  </div>
                  <button 
                    onClick={() => setDeleteGroupId(group.title)}
                    className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                    title="Hapus semua foto di grup ini"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Wadah Foto */}
              <div 
                className={`cursor-pointer ${gridClass}`}
                onClick={() => setSelectedGroup(group)}
              >
                {group.photos.slice(0, 4).map((photo: any, photoIndex: number) => {
                  const isLastAndHasMore = photoIndex === 3 && totalPhotos > 4
                  
                  return (
                    <div 
                      key={photo?.id || photoIndex} 
                      className={`relative w-full rounded-2xl overflow-hidden group/photo bg-gray-100 ${
                        isSinglePhoto ? '' : 'aspect-square' // Paksa kotak hanya jika > 1 foto
                      }`}
                    >
                      {photo?.storage_path ? (
                        <img 
                          src={getImageUrl(photo.storage_path)} 
                          alt="Memory" 
                          // Jika 1 foto: h-auto (bebas). Jika banyak: h-full object-cover (kotak rapi).
                          className={`w-full transition-transform duration-500 group-hover/photo:scale-105 ${
                            isSinglePhoto ? 'h-auto' : 'h-full object-cover'
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x600?text=Foto+Rusak'
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center bg-gray-200 text-gray-400 text-xs">No Path</div>
                      )}

                      {isLastAndHasMore && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-2xl">+{totalPhotos - 4}</span>
                        </div>
                      )}

                      {!isLastAndHasMore && (
                        <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors pointer-events-none" />
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(photo.id)
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full opacity-60 hover:opacity-100 hover:bg-red-500 transition-all backdrop-blur-sm z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {group.caption && (
                <p className="text-sm text-gray-500 mt-3 px-1 italic">"{group.caption}"</p>
              )}
            </div>
          )
        })}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mt-6">
          <p className="text-sm text-gray-500 font-medium">
            Halaman <span className="font-bold text-gray-800">{currentPage}</span> dari <span className="font-bold text-gray-800">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* POPUP LIHAT SEMUA FOTO */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 backdrop-blur-md overflow-y-auto">
          <div className="flex justify-between items-center mb-4 text-white">
            <div>
              <h3 className="font-bold text-2xl">{selectedGroup.title}</h3>
              <p className="text-gray-400 text-sm">{selectedGroup.photos.length} Foto</p>
            </div>
            <button onClick={() => setSelectedGroup(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {selectedGroup.photos.map((photo: any) => (
              <div key={photo?.id || Math.random()} className="relative bg-gray-900 rounded-xl overflow-hidden group">
                <img 
                  src={getImageUrl(photo?.storage_path)} 
                  alt="Zoomed" 
                  className="w-full h-auto min-h-[300px] max-h-[70vh] object-contain" 
                />
                <button 
                  onClick={() => setDeleteId(photo.id)}
                  className="absolute bottom-3 right-3 p-3 bg-black/50 text-white rounded-full opacity-60 hover:opacity-100 hover:bg-red-500 transition-all backdrop-blur-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POPUP HAPUS PER FOTO */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Foto Ini?</h3>
            <p className="text-gray-500 mb-6">Foto ini akan dihapus permanen dari galeri.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200">Batal</button>
              <button onClick={handleDeletePhoto} disabled={isDeleting} className="flex-1 py-3 bg-red-500 font-bold rounded-xl text-white flex justify-center items-center hover:bg-red-600">
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP HAPUS PER KOLOM (GROUP) */}
      {deleteGroupId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Semua Foto?</h3>
            <p className="text-gray-500 mb-6">Semua foto dalam grup "{deleteGroupId}" akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteGroupId(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200">Batal</button>
              <button 
                onClick={() => {
                  const group = groupedMemories.find(g => g.title === deleteGroupId)
                  if (group) handleDeleteGroup(group)
                }} 
                disabled={isDeleting} 
                className="flex-1 py-3 bg-red-500 font-bold rounded-xl text-white flex justify-center items-center hover:bg-red-600"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}