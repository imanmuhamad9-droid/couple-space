'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { addMeeting, updateMeeting } from '@/app/actions/meetings'
import { Calendar, Sun, Moon } from 'lucide-react'

type Meeting = {
  id: number
  title: string
  description: string
  location: string
  start_at: string
  end_at: string
  status: string
  notes?: string 
}

export default function MeetingForm({ 
  initialData, 
  onClose,
  defaultDate 
}: { 
  initialData?: Meeting
  onClose: () => void 
  defaultDate?: Date | null
}) {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(
    initialData ? new Date(initialData.start_at) : (defaultDate || null)
  )
  
  // Ambil jam dari data lama, atau default ke 12:00
  const defaultStartTime = initialData ? new Date(initialData.start_at).toTimeString().slice(0, 5) : '12:00'
  const [startTime, setStartTime] = useState<string>(defaultStartTime)

  // Fungsi untuk mendeteksi Pagi/Siang/Malam dari jam yang dipilih
  const getTimeOfDay = (timeStr: string) => {
    if (!timeStr) return { text: '', icon: null }
    const hour = parseInt(timeStr.split(':')[0])
    
    if (hour >= 5 && hour < 11) {
      return { text: 'Pagi / Siang', icon: <Sun size={16} className="text-orange-400" /> }
    } else if (hour >= 11 && hour < 15) {
      return { text: 'Siang', icon: <Sun size={16} className="text-orange-500" /> }
    } else if (hour >= 15 && hour < 18) {
      return { text: 'Sore', icon: <Sun size={16} className="text-yellow-500" /> }
    } else {
      return { text: 'Malam', icon: <Moon size={16} className="text-blue-600" /> }
    }
  }

  const timeOfDay = getTimeOfDay(startTime)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      let finalStart = ''
      if (startDate && startTime) {
        const [hours, minutes] = startTime.split(':')
        const newDate = new Date(startDate)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        finalStart = newDate.toISOString() // Kembali ke standar browser/server
      }

      formData.set('start_at', finalStart)
      formData.set('status', initialData?.status || 'planned')

      if (initialData) {
        await updateMeeting(initialData.id, formData)
      } else {
        await addMeeting(formData)
      }
      onClose()
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan saat menyimpan data.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] font-medium"

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="status" value={initialData?.status || 'planned'} />

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Judul Rencana</label>
        <input
          type="text"
          name="title"
          defaultValue={initialData?.title}
          required
          className={inputClass}
          placeholder="Misal: Anniversary Dinner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal</label>
          <div className="relative">
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              dateFormat="dd MMMM yyyy"
              locale="id"
              placeholderText="Pilih tanggal"
              className={`${inputClass} cursor-pointer`}
              required
            />
            <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Jam Mulai</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`${inputClass} text-center`}
            required
          />
          {/* PENJELAS SIANG/MALAM */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-bold text-gray-500 bg-gray-50 py-1.5 rounded-lg border border-gray-100">
            {timeOfDay.icon}
            <span>{timeOfDay.text}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Lokasi</label>
        <input
          type="text"
          name="location"
          defaultValue={initialData?.location}
          className={inputClass}
          placeholder="Misal: Restoran Italia"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Catatan / Detail Rencana</label>
        <textarea
          name="notes"
          defaultValue={initialData?.notes}
          rows={3}
          className={inputClass}
          placeholder="Misal: Jangan lupa bawa jaket, atau dresscode warna biru..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-[var(--theme-primary)] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:bg-gray-400 shadow-md"
        >
          {loading ? 'Menyimpan...' : 'Simpan Rencana'}
        </button>
      </div>
    </form>
  )
}