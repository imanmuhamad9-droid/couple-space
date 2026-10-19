'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { addMeeting, updateMeeting } from '@/app/actions/meetings'
import { Calendar } from 'lucide-react'

type Meeting = {
  id: number
  title: string
  description: string
  location: string
  start_at: string
  end_at: string
  status: string
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
  
  // State untuk Tanggal (Calendar)
  const [startDate, setStartDate] = useState<Date | null>(
    initialData ? new Date(initialData.start_at) : (defaultDate || null)
  )
  const [endDate, setEndDate] = useState<Date | null>(
    initialData?.end_at ? new Date(initialData.end_at) : null
  )

  // State untuk Jam (Input Manual)
  const [startTime, setStartTime] = useState<string>(
    initialData ? new Date(initialData.start_at).toTimeString().slice(0, 5) : '12:00'
  )
  const [endTime, setEndTime] = useState<string>(
    initialData?.end_at ? new Date(initialData.end_at).toTimeString().slice(0, 5) : ''
  )

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      let finalStart = ''
      if (startDate && startTime) {
        const [hours, minutes] = startTime.split(':')
        const newDate = new Date(startDate)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        finalStart = newDate.toISOString()
      }

      let finalEnd = ''
      if (endDate && endTime) {
        const [hours, minutes] = endTime.split(':')
        const newDate = new Date(endDate)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        finalEnd = newDate.toISOString()
      }

      formData.set('start_at', finalStart)
      formData.set('end_at', finalEnd)

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

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pertemuan</label>
        <input
          type="text"
          name="title"
          defaultValue={initialData?.title}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Misal: Nonton Bioskop"
        />
      </div>

      {/* BLOK MULAI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
          <div className="relative">
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              dateFormat="dd MMMM yyyy"
              locale="id"
              placeholderText="Pilih tanggal"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 text-sm cursor-pointer"
              required
            />
            <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
          <div className="flex gap-1">
            {/* Kita pakai input time tapi kita styling biar rapi */}
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 text-sm bg-white text-center cursor-pointer"
              required
            />
          </div>
        </div>
      </div>

      {/* BLOK SELESAI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai (Opsional)</label>
          <div className="relative">
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              dateFormat="dd MMMM yyyy"
              locale="id"
              placeholderText="Pilih tanggal"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 text-sm cursor-pointer"
            />
            <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
          <div className="flex gap-1">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-2 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 text-sm bg-white text-center cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi (Opsional)</label>
        <input
          type="text"
          name="location"
          defaultValue={initialData?.location}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Misal: Plaza Indonesia"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
        <textarea
          name="description"
          defaultValue={initialData?.description}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Jangan lupa bawa jaket..."
        />
      </div>

      {initialData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={initialData.status}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
          >
            <option value="planned">Planned (Rencana)</option>
            <option value="done">Done (Selesai)</option>
            <option value="cancelled">Cancelled (Batal)</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}