'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { updateSettings } from '@/app/actions/settings'
import { Calendar, Save } from 'lucide-react'
import { format } from 'date-fns'

type Settings = {
  partner_a_name: string
  partner_b_name: string
  anniversary_date: string
}

export default function SettingsForm({ initialData }: { initialData: Settings | null }) {
  const [loading, setLoading] = useState(false)
  
  // State buat tanggal jadian
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(
    initialData?.anniversary_date ? new Date(initialData.anniversary_date) : null
  )

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      // Format tanggal jadi YYYY-MM-DD sebelum dikirim ke server
      formData.set('anniversary_date', anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : '')
      
      await updateSettings(formData)
      alert('Pengaturan berhasil disimpan!')
    } catch (error) {
      console.error(error)
      alert('Gagal menyimpan pengaturan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Nama Kalian */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">Profil Kalian</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kamu</label>
            <input
              type="text"
              name="partner_a_name"
              defaultValue={initialData?.partner_a_name || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="Misal: Andi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pasangan</label>
            <input
              type="text"
              name="partner_b_name"
              defaultValue={initialData?.partner_b_name || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="Misal: Sinta"
            />
          </div>
        </div>
      </div>

      {/* Tanggal Jadian */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-lg text-gray-800 border-b border-gray-100 pb-2">Momen Spesial</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jadian (Anniversary)</label>
          <p className="text-xs text-gray-500 mb-2">Tanggal ini akan muncul sebagai hitung mundur di Dashboard.</p>
          <div className="relative">
            <DatePicker
              selected={anniversaryDate}
              onChange={(date) => setAnniversaryDate(date)}
              dateFormat="dd MMMM yyyy"
              locale="id"
              placeholderText="Pilih tanggal jadian"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 text-sm cursor-pointer"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
            />
            <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tombol Simpan */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          <Save size={18} />
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  )
}