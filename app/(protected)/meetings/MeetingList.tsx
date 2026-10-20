'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays, Quote } from 'lucide-react'
import MeetingForm from '@/components/MeetingForm'
import MemoryUploadForm from '@/components/MemoryUploadForm'
import ConfirmModal from '@/components/ConfirmModal'
import { deleteMeeting } from '@/app/actions/meetings'

type Meeting = {
  id: number
  title: string
  description: string
  location: string
  start_at: string
  end_at: string
  status: string
  notes?: string
  memories?: { id: number, storage_path: string, caption: string }[] 
}

export default function MeetingList({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined)
  
  // State untuk Confirm Modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'done'>('upcoming')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 
  
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

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

  const getProcessedMeetings = () => {
    let filtered = initialMeetings
    if (filter === 'upcoming') {
      filtered = initialMeetings.filter(m => m.status === 'planned')
    } else if (filter === 'done') {
      filtered = initialMeetings.filter(m => m.status === 'done')
    }

    filtered.sort((a, b) => {
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    })

    const groups: Record<string, Meeting[]> = {}
    filtered.forEach(m => {
      const dateStr = format(parseISO(m.start_at), 'yyyy-MM-dd')
      if (!groups[dateStr]) groups[dateStr] = []
      groups[dateStr].push(m)
    })

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

  // Fungsi Eksekusi Hapus
  const executeDelete = async () => {
    if (!confirmDeleteId) return
    setIsDeleting(true)
    try {
      await deleteMeeting(confirmDeleteId)
      setConfirmDeleteId(null)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const openUploadModal = (id: number) => {
    setSelectedMeetingId(id)
    setIsUploadModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Custom Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        title="Hapus Jadwal?"
        message="Jadwal ini akan dihapus permanen. Yakin mau lanjut?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isLoading={isDeleting}
      />

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
        <div className="flex gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full w-fit border border-gray-100 shadow-sm">
          <button onClick={() => setFilter('upcoming')} className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'upcoming' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-500 hover:text-[var(--theme-primary)]'}`}>Akan Datang</button>
          <button onClick={() => setFilter('done')} className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'done' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-500 hover:text-[var(--theme-primary)]'}`}>Selesai</button>
          <button onClick={() => setFilter('all')} className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${filter === 'all' ? 'bg-[var(--theme-primary)] text-white shadow-md' : 'text-gray-500 hover:text-[var(--theme-primary)]'}`}>Semua</button>
        </div>

        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:scale-105 transition-transform shadow-md">
          <Plus size={18} /> Tambah Jadwal
        </button>
      </div>

      {/* List Meetings (Grouped) */}
      <div className="space-y-6">
        {paginatedGroups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Belum ada jadwal di kategori ini.</p>
          </div>
        ) : (
          paginatedGroups.map(([dateStr, meetingsOnDate]) => (
            <div key={dateStr} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              
              <div className="bg-[var(--theme-primary)] px-6 py-3.5 flex justify-between items-center transition-colors duration-500">
                <div className="flex items-center gap-3 text-white">
                  <CalendarDays size={20} />
                  <h3 className="font-bold text-lg">
                    {format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                  </h3>
                </div>
                {format(new Date(), 'yyyy-MM-dd') === dateStr && (
                  <span className="text-[10px] font-bold text-[var(--theme-primary)] bg-white px-3 py-1 rounded-full shadow-sm">HARI INI</span>
                )}
              </div>
              
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetingsOnDate.map(meeting => (
                  <div key={meeting.id} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 flex flex-row gap-4 hover:border-[var(--theme-primary-light)] transition-colors">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm">
                          <Clock size={12} /> {format(parseISO(meeting.start_at), 'HH:mm')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          meeting.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-[var(--theme-primary-light)] text-[var(--theme-primary)]'
                        }`}>
                          {meeting.status === 'done' ? 'SELESAI' : 'TERENCANA'}
                        </span>
                      </div>

                      <h4 className="font-bold text-lg text-gray-800 leading-tight mb-1">{meeting.title}</h4>
                      
                      {meeting.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-3">
                          <MapPin size={14} className="text-[var(--theme-primary)] flex-shrink-0" />
                          <span>{meeting.location}</span>
                        </div>
                      )}

                      {meeting.notes && (
                        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-100">
                          <Quote size={12} className="mt-0.5 text-[var(--theme-primary)] flex-shrink-0" />
                          <p className="line-clamp-2">{meeting.notes}</p>
                        </div>
                      )}

                      {meeting.memories && meeting.memories.length > 0 && (
                        <div className="mt-3">
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {meeting.memories.map((mem) => (
                              <div 
                                key={mem.id} 
                                onClick={() => imageUrls[mem.storage_path] && setLightboxImage(imageUrls[mem.storage_path])}
                                className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                              >
                                {imageUrls[mem.storage_path] ? (
                                  <img src={imageUrls[mem.storage_path]} alt="Memory" className="object-cover w-full h-full" />
                                ) : (
                                  <div className="w-full h-full animate-pulse bg-gray-200"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-32 flex-shrink-0 justify-center items-center">
                      {meeting.status === 'planned' && (
                        <>
                          <button onClick={() => openUploadModal(meeting.id)} className="w-full px-3 py-1.5 bg-green-50 text-green-600 text-[11px] font-bold rounded-lg hover:bg-green-100 transition-colors text-center">
                            Tandai Selesai
                          </button>
                          <button onClick={() => handleEdit(meeting)} className="w-full px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-colors text-center">
                            Edit
                          </button>
                        </>
                      )}
                      {meeting.status !== 'done' && (
                        <button onClick={() => setConfirmDeleteId(meeting.id)} className="w-full px-3 py-1.5 bg-red-50 text-red-500 text-[11px] font-bold rounded-lg hover:bg-red-100 transition-colors text-center">
                          Hapus
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
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 mt-6">
          <p className="text-sm text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, totalGroups)}</span> dari <span className="font-bold text-gray-800">{totalGroups}</span> tanggal
          </p>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50 hover:bg-[var(--theme-primary-light)] hover:text-[var(--theme-primary)] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-700">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50 hover:bg-[var(--theme-primary-light)] hover:text-[var(--theme-primary)] transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

          {/* Modal Edit/Tambah Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 pt-10 md:pt-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          {/* Tambahin pb-32 biar bisa di-scroll sampe bawah, nggak ketutup bottom bar */}
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl mb-32 md:mb-0 relative">
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