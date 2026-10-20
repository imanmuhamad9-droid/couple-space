'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { updateSettings } from '@/app/actions/settings'
import { Calendar, Save, User, Heart, Sparkles, Palette } from 'lucide-react'
import { format } from 'date-fns'
import { useTheme } from '@/components/ThemeProvider'

type Settings = {
  partner_a_name: string
  partner_b_name: string
  anniversary_date: string
  theme_color?: string
}

export default function SettingsForm({ initialData }: { initialData: Settings | null }) {
  const [loading, setLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  
  const [nameA, setNameA] = useState(initialData?.partner_a_name || '')
  const [nameB, setNameB] = useState(initialData?.partner_b_name || '')
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(
    initialData?.anniversary_date ? new Date(initialData.anniversary_date) : null
  )

  // Fungsi ubah warna langsung tanpa nunggu klik simpan
  const handleColorChange = async (color: string) => {
    setTheme(color as any) // Ubah layar langsung
    const formData = new FormData()
    formData.set('theme_color', color)
    
    // Kita simpan ke database diam-diam
    try {
      await updateSettings(formData)
    } catch (error) {
      console.error('Gagal simpan warna', error)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      formData.set('anniversary_date', anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : '')
      formData.set('theme_color', theme) // Pastikan warna terbaru ikut tersimpan
      
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
    <div className="w-full max-w-5xl mx-auto">
      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* KOLOM KIRI: PROFIL KALIAN */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-2xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Profil Kalian</h2>
              <p className="text-sm text-gray-500 mt-0.5">Siapa saja penghuni ruang ini?</p>
            </div>
          </div>

          {/* Preview Avatar */}
          <div className="flex items-center justify-center gap-8 mb-10 py-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--theme-gradient-from)] to-[var(--theme-primary)] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {nameA ? nameA.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-sm font-bold text-gray-700 max-w-[100px] truncate">{nameA || 'Kamu'}</span>
            </div>
            
            <Heart className="text-[var(--theme-primary)]" size={32} fill="currentColor" />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-gradient-to)] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {nameB ? nameB.charAt(0).toUpperCase() : 'B'}
              </div>
              <span className="text-sm font-bold text-gray-700 max-w-[100px] truncate">{nameB || 'Pasangan'}</span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kamu</label>
              <input
                type="text"
                name="partner_a_name"
                value={nameA}
                onChange={(e) => setNameA(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] font-medium transition-all"
                placeholder="Misal: Aden"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nama Pasangan</label>
              <input
                type="text"
                name="partner_b_name"
                value={nameB}
                onChange={(e) => setNameB(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] font-medium transition-all"
                placeholder="Misal: Akil"
              />
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: MOMEN SPESIAL & TEMA */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Momen Spesial</h2>
              <p className="text-sm text-gray-500 mt-0.5">Kapan kisah kita dimulai?</p>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Jadian</label>
              <div className="relative">
                <DatePicker
                  selected={anniversaryDate}
                  onChange={(date: Date | null) => setAnniversaryDate(date)}
                  dateFormat="dd MMMM yyyy"
                  locale="id"
                  placeholderText="Pilih tanggal jadian"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-sm font-medium cursor-pointer transition-all"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                />
                <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* PEMILIH WARNA TEMA */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Palette size={18} className="text-[var(--theme-primary)]"/> Warna Tema Aplikasi
              </label>
              <p className="text-xs text-gray-500 mb-3">Pilih warna kesukaan kalian.</p>
              
              <div className="flex gap-3">
                {[
                  { id: 'blue', color: 'bg-blue-500' },
                  { id: 'pink', color: 'bg-pink-500' },
                  { id: 'green', color: 'bg-emerald-500' },
                  { id: 'purple', color: 'bg-purple-500' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleColorChange(c.id)}
                    className={`w-12 h-12 rounded-full border-4 ${c.color} ${
                      theme === c.id ? 'border-gray-800 scale-110 shadow-lg' : 'border-white shadow-sm'
                    } hover:scale-110 transition-all duration-300`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-[var(--theme-primary-light)]/50 p-5 rounded-2xl border border-[var(--theme-primary-light)] flex items-start gap-3 mt-4">
              <Sparkles className="text-[var(--theme-primary)] mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-gray-700 leading-relaxed">
                Jika kamu mengubah warna atau nama, pasanganmu juga akan melihat perubahan yang sama saat membuka web ini.
              </p>
            </div>
          </div>

          {/* Tombol Simpan di bawah Kanan */}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] text-white text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save size={20} />
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}