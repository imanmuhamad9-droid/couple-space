'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus, X, ChevronLeft, ChevronRight, MapPin, Calendar as CalendarIcon, CheckCircle, Circle } from 'lucide-react'
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate })

  const meetingsForSelectedDate = initialMeetings.filter(meeting => {
    return isSameDay(parseISO(meeting.start_at), selectedDate)
  }).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingMeeting(undefined)
    setIsModalOpen(true)
  }

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

  const hasMeetingOnDate = (date: Date) => {
    return initialMeetings.some(m => isSameDay(parseISO(m.start_at), date))
  }

  const changeDate = (newDate: Date) => {
    setSelectedDate(newDate)
    setCurrentDate(newDate)
  }

  const daysToShow = 14
  const startOfRange = startOfWeek(subWeeks(selectedDate, 1), { weekStartsOn: 1 }) 
  const rangeDays = Array.from({ length: daysToShow }).map((_, i) => addDays(startOfRange, i))

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4">
      
      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        title="Hapus Jadwal?"
        message="Jadwal ini akan dihapus permanen. Yakin mau lanjut?"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
        isLoading={isDeleting}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-800 tracking-tight">
            {format(selectedDate, 'MMMM d', { locale: localeId })}
          </h2>
          <p className="text-gray-500 font-medium mt-2 text-lg">
            {meetingsForSelectedDate.length} agenda hari ini
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFullCalendarOpen(true)}
            className="w-12 h-12 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            title="Buka Kalender"
          >
            <CalendarIcon size={22} />
          </button>
          
          <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-[var(--theme-primary)] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-md">
            <Plus size={18} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* BARISAN TANGGAL */}
      <div className="relative border-b border-gray-200 pb-6">
        <div className="grid grid-cols-7 md:grid-cols-14 gap-2 md:gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {rangeDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            const hasMeeting = hasMeetingOnDate(day)

            let textColorClass = "text-gray-400"
            if (isSelected) {
              textColorClass = "text-white"
            } else if (hasMeeting) {
              textColorClass = "text-[var(--theme-primary)] font-black"
            }

            return (
              <button
                key={day.toString()}
                onClick={() => changeDate(day)}
                className={`flex flex-col items-center justify-center mx-auto w-[50px] md:w-[60px] h-[75px] md:h-[85px] rounded-[2rem] transition-all ${
                  isSelected ? 'bg-gray-900 shadow-xl transform scale-105' 
                  : 'hover:bg-gray-100'
                }`}
              >
                <span className={`text-xs font-bold mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                  {format(day, 'd')}
                </span>
                <span className={`text-[12px] md:text-[14px] font-bold uppercase ${textColorClass}`}>
                  {format(day, 'EEE', { locale: localeId })}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* TIMELINE JADWAL */}
      <div className="pt-2">
        {meetingsForSelectedDate.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <CalendarIcon className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">Tidak ada agenda di tanggal ini.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {meetingsForSelectedDate.map((meeting, index) => {
              const isLast = index === meetingsForSelectedDate.length - 1;
              
              return (
                <div key={meeting.id} className="flex gap-6 relative group">
                  
                  {/* KOLOM JAM */}
                  <div className="w-20 md:w-24 flex-shrink-0 flex flex-col items-end pt-5 pr-2">
                    <span className="text-[12px] md:text-[13px] font-bold text-gray-500">
                      {format(parseISO(meeting.start_at), 'HH:mm aa')}
                    </span>
                  </div>

                  {/* GARIS PUTUS-PUTUS & KOTAK JADWAL */}
                  <div className={`flex-1 pb-6 relative ${
                    !isLast ? 'border-l-2 border-dashed border-gray-300 ml-2 pl-6' : 'ml-2 pl-6'
                  }`}>
                    
                    <div className="absolute -left-[7px] top-7 w-3 h-3 bg-white border-2 border-gray-400 rounded-full"></div>

                    <div className={`p-5 md:p-6 rounded-3xl border shadow-sm relative transition-all ${
                      meeting.status === 'done' 
                        ? 'bg-green-50 border-green-200 opacity-80' 
                        : 'bg-[var(--theme-primary-light)] border-[var(--theme-primary-light)]'
                    }`}>
                      
                      <div className="flex justify-between items-start">
                        <div className="pr-10">
                          <h3 className={`text-xl font-bold text-gray-800 leading-tight ${meeting.status === 'done' ? 'line-through text-green-900' : ''}`}>
                            {meeting.title}
                          </h3>
                          {meeting.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium mt-2">
                              <MapPin size={14} className={meeting.status === 'done' ? 'text-green-600' : 'text-[var(--theme-primary)]'} /> {meeting.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute top-4 right-4">
                          {meeting.status === 'planned' ? (
                            <button onClick={() => openUploadModal(meeting.id)} className="p-2 bg-white text-green-600 rounded-full shadow-sm hover:scale-110 transition-transform" title="Tandai Selesai">
                              <Circle size={20} />
                            </button>
                          ) : (
                            <div className="p-2 text-green-600">
                              <CheckCircle size={20} />
                            </div>
                          )}
                        </div>
                      </div>

                      {meeting.notes && (
                        <div className="mt-4 text-sm text-gray-700 bg-white/70 p-3 rounded-xl border border-black/5 italic">
                          "{meeting.notes}"
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-3">
                        <button onClick={() => setConfirmDeleteId(meeting.id)} className="text-xs font-bold bg-white px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 shadow-sm">
                          Hapus
                        </button>
                        <button onClick={() => handleEdit(meeting)} className="text-xs font-bold bg-white px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 shadow-sm">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL KALENDER PENUH */}
      {isFullCalendarOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: localeId })}
              </h2>
              <button onClick={() => setIsFullCalendarOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-gray-500">Pilih Tanggal</span>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, i) => {
                const isSelected = isSameDay(day, selectedDate)
                const isThisMonth = isSameMonth(day, currentDate)
                const hasMeeting = hasMeetingOnDate(day)

                return (
                  <button
                    key={i}
                    onClick={() => {
                      changeDate(day)
                      setIsFullCalendarOpen(false)
                    }}
                    className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl text-sm font-bold transition-all ${
                      isSelected ? 'bg-[var(--theme-primary)] text-white shadow-md' 
                      : isThisMonth ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'
                    }`}
                  >
                    {format(day, 'd')}
                    {hasMeeting && (
                      <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-[var(--theme-primary)]'}`}></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Form & Upload Memori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-4 pt-10 md:pt-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl mb-32 md:mb-0 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingMeeting ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <MeetingForm initialData={editingMeeting} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}

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