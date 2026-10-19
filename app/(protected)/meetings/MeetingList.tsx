'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus, Edit2, Trash2, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import MeetingForm from '@/components/MeetingForm'
import MemoryUploadForm from '@/components/MemoryUploadForm'
import { deleteMeeting } from '@/app/actions/meetings'

type Meeting = {
  id: number
  title: string
  description: string
  location: string
  start_at: string
  end_at: string
  status: string
  memories?: { id: number, storage_path: string, caption: string }[] 
}

export default function MeetingList({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined)
  
  // State Filter & Pagination
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'done'>('upcoming')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // 10 Kotak Tanggal per halaman
  
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Reset halaman ke 1 kalau ganti filter
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  // Ambil URL gambar
  useEffect(() => {
    const fetchUrls = async () => {
      const newUrls: Record<string, string> = {}
      for (const meeting of initialMeetings) {
        if (meeting.memories && meeting.memories.length > 0) {
          const uniqueMemories = Array.from(new Set(meeting.memories.map(m => m.storage_path)))
          for (const path of uniqueMemories) {
            if (!imageUrls[path] && !newUrls[path]) {
              const res = await fetch(`/api/get-image?path=${encodeURIComponent(path)}`)
              const data = await res.json()
              if (data.url) newUrls[path] = data.url
            }
          }
        }
      }
      setImageUrls(prev => ({ ...prev, ...newUrls }))
    }
    fetchUrls()
  }, [initialMeetings])

  // LOGIKA FILTER & GROUPING
  const getProcessedMeetings = () => {
    let filtered = initialMeetings
    if (filter === 'upcoming') {
      filtered = initialMeetings.filter(m => m.status === 'planned')
    } else if (filter === 'done') {
      filtered = initialMeetings.filter(m => m.status === 'done')
    }

    // Urutkan: planned di atas, lalu berdasarkan tanggal
    filtered.sort((a, b) => {
      if (a.status === 'planned' && b.status !== 'planned') return -1
      if (a.status !== 'planned' && b.status === 'planned') return 1
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    })

    // Grouping per tanggal
    const groups: Record<string, Meeting[]> = {}
    filtered.forEach(m => {
      const dateStr = format(parseISO(m.start_at), 'yyyy-MM-dd')
      if (!groups[dateStr]) groups[dateStr] = []
      groups[dateStr].push(m)
    })

    // Pagination Logic
    const groupedArray = Object.entries(groups)
    const totalPages = Math.ceil(groupedArray.length / itemsPerPage)
    const paginatedGroups = groupedArray.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )

    return { paginatedGroups, totalPages, totalGroups: groupedArray.length }
  }

  const { paginatedGroups, totalPages, totalGroups } = getProcessedMeetings()

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingMeeting(undefined)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Yakin mau hapus jadwal ini?')) {
      await deleteMeeting(id)
    }
  }

  const openUploadModal = (id: number) => {
    setSelectedMeetingId(id)
    setIsUploadModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-6 right-6 text-white hover:text-gray-300">
            <X size={32} />
          </button>
        </div>
      )}

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 bg-blue-50 p-1.5 rounded-full w-fit">
          <button 
            onClick={() => setFilter('upcoming')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'upcoming' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Akan Datang
          </button>
          <button 
            onClick={() => setFilter('done')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'done' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Selesai
          </button>
          <button 
            onClick={() => setFilter('all')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'all' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Semua
          </button>
        </div>

        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:scale-105 transition-transform shadow-md">
          <Plus size={18} /> Tambah Jadwal
        </button>
      </div>

      {/* List Meetings (Grouped) */}
      <div className="space-y-6">
        {paginatedGroups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-blue-200">
            <p className="text-gray-500 font-medium">Belum ada jadwal di kategori ini.</p>
          </div>
        ) : (
          paginatedGroups.map(([dateStr, meetingsOnDate]) => (
            <div key={dateStr} className="bg-white rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
              {/* Header Tanggal */}
              <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-50 flex justify-between items-center">
                <h3 className="font-bold text-blue-900">
                  {format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                </h3>
                {format(new Date(), 'yyyy-MM-dd') === dateStr && (
                  <span className="text-xs font-bold text-white bg-blue-500 px-3 py-1 rounded-full shadow-sm">HARI INI</span>
                )}
              </div>
              
              {/* List Acara di Tanggal Tersebut */}
              <div className="divide-y divide-gray-50">
                {meetingsOnDate.map(meeting => (
                  <div key={meeting.id} className="p-6 flex flex-col md:flex-row gap-5 justify-between md:items-start hover:bg-blue-50/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg text-gray-800">{meeting.title}</h4>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider ${
                          meeting.status === 'done' ? 'bg-green-100 text-green-700' :
                          meeting.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {meeting.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600 font-bold bg-gray-100 px-2.5 py-1 rounded-md">
                          {format(parseISO(meeting.start_at), 'HH:mm')} WIB
                        </span>
                      </div>
                      {meeting.location && <p className="text-sm text-gray-600 font-medium">📍 {meeting.location}</p>}
                      {meeting.description && <p className="text-sm text-gray-500 mt-2">{meeting.description}</p>}

                      {/* Galeri Foto */}
                      {meeting.memories && meeting.memories.length > 0 && (
                        <div className="mt-4">
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {meeting.memories.map((mem) => (
                              <div 
                                key={mem.id} 
                                onClick={() => imageUrls[mem.storage_path] && setLightboxImage(imageUrls[mem.storage_path])}
                                className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              >
                                {imageUrls[mem.storage_path] ? (
                                  <img src={imageUrls[mem.storage_path]} alt="Memory" className="object-cover w-full h-full" />
                                ) : (
                                  <div className="w-full h-full animate-pulse bg-gray-200"></div>
                                )}
                              </div>
                            ))}
                          </div>
                          {meeting.memories[0].caption && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-xl text-sm text-gray-700 italic border border-gray-100">
                              "{meeting.memories[0].caption}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-2">
                      {meeting.status === 'planned' && (
                        <>
                          <button onClick={() => openUploadModal(meeting.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                            <CheckCircle2 size={16} /> Done
                          </button>
                          <button onClick={() => handleEdit(meeting)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                            <Edit2 size={20} />
                          </button>
                        </>
                      )}
                      {meeting.status !== 'done' && (
                         <button onClick={() => handleDelete(meeting.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                           <Trash2 size={20} />
                         </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalGroups > itemsPerPage && (
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-blue-50 mt-6">
          <p className="text-sm text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, totalGroups)}</span> dari <span className="font-bold text-gray-800">{totalGroups}</span> tanggal
          </p>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-700">
              {currentPage} / {totalPages}
            </span>
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

      {/* Modal Edit/Tambah Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingMeeting ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <MeetingForm initialData={editingMeeting} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Modal Upload Memori */}
      {isUploadModalOpen && selectedMeetingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Upload Kenangan</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Simpan momen indah dari pertemuan ini.</p>
            <MemoryUploadForm meetingId={selectedMeetingId} onClose={() => setIsUploadModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}