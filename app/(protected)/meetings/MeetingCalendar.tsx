'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X, Plus, CheckCircle2, Edit2, Trash2 } from 'lucide-react'
import MeetingForm from '@/components/MeetingForm'
import MemoryUploadForm from '@/components/MemoryUploadForm'
import { deleteMeeting } from '@/app/actions/meetings'

type Meeting = {
  id: number
  title: string
  start_at: string
  status: string
  location: string
  description: string
  memories?: { id: number, storage_path: string, caption: string }[]
}

export default function MeetingCalendar({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadMeetingId, setUploadMeetingId] = useState<number | null>(null)

  // Logic Kalender
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Senin
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  // Ambil jadwal di tanggal terpilih
  const meetingsOnSelectedDate = selectedDate 
    ? initialMeetings.filter(m => isSameDay(parseISO(m.start_at), selectedDate))
    : []

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setIsFormOpen(true)
  }
  
  const handleDelete = async (id: number) => {
    if (confirm('Hapus jadwal ini?')) {
      await deleteMeeting(id)
      // Jika data habis di tanggal itu, tutup panel (opsional)
      if (meetingsOnSelectedDate.length === 1) setSelectedDate(null)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      {/* Header Kalender */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Grid Hari */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-semibold text-gray-400">{day}</div>
        ))}
      </div>

      {/* Grid Tanggal */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const meetings = initialMeetings.filter(m => isSameDay(parseISO(m.start_at), day))
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <div 
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[80px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col ${
                isCurrentMonth ? 'bg-white border-gray-100 hover:border-black' : 'bg-gray-50 border-transparent text-gray-400'
              } ${isSelected ? 'ring-2 ring-black border-transparent' : ''}`}
            >
              <span className={`text-sm font-medium ${isSelected ? 'text-black' : ''}`}>{format(day, 'd')}</span>
              
              {/* Indikator Titik Kalau Ada Jadwal */}
              <div className="mt-auto flex gap-1 flex-wrap">
                {meetings.map(m => (
                  <div key={m.id} className={`w-2 h-2 rounded-full ${m.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} title={m.title} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Panel Detail Tanggal Terpilih */}
      {selectedDate && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm" onClick={() => setSelectedDate(null)}>
          <div 
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">{format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: localeId })}</h3>
                <p className="text-sm text-gray-500">{meetingsOnSelectedDate.length} Jadwal</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
            </div>

            <button 
              onClick={() => { setEditingMeeting(undefined); setIsFormOpen(true) }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 mb-6"
            >
              <Plus size={18} /> Tambah Jadwal di Tanggal Ini
            </button>

            <div className="space-y-4">
              {meetingsOnSelectedDate.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Belum ada jadwal di tanggal ini.</p>
              ) : (
                meetingsOnSelectedDate.map(meeting => (
                  <div key={meeting.id} className="p-4 border border-gray-100 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{meeting.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        meeting.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{meeting.status.toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{format(parseISO(meeting.start_at), 'HH:mm')} WIB</p>
                    {meeting.location && <p className="text-sm text-gray-600">📍 {meeting.location}</p>}
                    
                    <div className="flex gap-2 mt-4">
                      {meeting.status === 'planned' && (
                        <>
                          <button onClick={() => { setUploadMeetingId(meeting.id); setIsUploadOpen(true) }} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100 flex justify-center items-center gap-1"><CheckCircle2 size={16}/> Done</button>
                          <button onClick={() => handleEdit(meeting)} className="p-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg"><Edit2 size={18}/></button>
                        </>
                      )}
                      <button onClick={() => handleDelete(meeting.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Form & Upload (Sama seperti sebelumnya) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">{editingMeeting ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <MeetingForm initialData={editingMeeting} onClose={() => setIsFormOpen(false)} defaultDate={selectedDate} />
          </div>
        </div>
      )}

      {isUploadOpen && uploadMeetingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Upload Kenangan</h2>
              <button onClick={() => setIsUploadOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <MemoryUploadForm meetingId={uploadMeetingId} onClose={() => setIsUploadOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}