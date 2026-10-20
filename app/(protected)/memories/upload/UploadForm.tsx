'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadManualMemories } from '@/app/actions/meetings'
import { UploadCloud, X, ArrowLeft, Calendar, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import DatePicker from 'react-datepicker'

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles])

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      formData.set('manual_date', selectedDate ? selectedDate.toISOString() : '')
      await uploadManualMemories(formData)
      router.push('/memories')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Gagal upload foto. Coba lagi ya.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* Tombol Kembali */}
      <div className="mb-8">
        <Link 
          href="/memories" 
          className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-600 shadow-sm border border-gray-100 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary-light)] transition-all"
        >
          <ArrowLeft size={18} /> Kembali ke Galeri
        </Link>
        <h1 className="text-3xl font-black text-gray-800 mt-6 font-slab">Tambah Kenangan Baru</h1>
        <p className="text-gray-500 font-medium mt-1">Upload foto di luar jadwal pertemuan kita.</p>
      </div>

      {/* Form Layout 2 Kolom */}
      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Area Upload & Preview */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-[var(--theme-primary)]" /> Pilih Foto
          </h2>
          
          <div className="border-2 border-dashed border-[var(--theme-primary-light)] rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--theme-primary-light)]/30 transition-colors relative flex-1 min-h-[300px]">
            <input
              type="file"
              name="files"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-20 h-20 bg-[var(--theme-primary-light)] text-[var(--theme-primary)] rounded-full flex items-center justify-center mb-4">
              <UploadCloud size={40} />
            </div>
            <p className="text-base font-bold text-gray-700">Klik untuk pilih foto</p>
            <p className="text-sm text-gray-400 mt-1">Bisa pilih lebih dari satu foto</p>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-6">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 shadow-sm">
                  <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail Form */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col space-y-5">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Detail Foto Kenangan</h2>

          {/* INPUT JUDUL BARU */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Judul Kenangan</label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-sm font-medium"
              placeholder="Misal: Ngopi Sore"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Kenangan</label>
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => setSelectedDate(date)}
                dateFormat="dd MMMM yyyy"
                locale="id"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-sm font-medium cursor-pointer"
                required
              />
              <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
                      </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Kenangan</label>
            <textarea
              name="caption"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-sm flex-1 min-h-[100px]"
              placeholder="Misal: Hari ini seru bangett, ketemu temen lama..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] text-white text-base font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-md"
            >
              {loading ? 'Menyimpan...' : 'Simpan ke Galeri'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}