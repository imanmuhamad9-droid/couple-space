'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadManualMemories } from '@/app/actions/meetings'
import { ImagePlus, Loader2, X, Image as ImageIcon } from 'lucide-react'

export default function UploadForm() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Mendapatkan tanggal hari ini untuk default input date (format YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0]

  // Membuat URL preview setiap kali file dipilih
  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)

    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [selectedFiles])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    if (selectedFiles.length === 0) {
      alert('Pilih minimal 1 foto dulu ya!')
      return
    }

    setLoading(true)
    setProgress(10)

    const formData = new FormData(e.currentTarget)
    selectedFiles.forEach(file => {
      formData.append('files', file)
    })

    try {
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p))
      }, 500)

      await uploadManualMemories(formData)
      
      clearInterval(interval)
      setProgress(100)
      
      setTimeout(() => {
        setSelectedFiles([])
        setLoading(false)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (formRef.current) formRef.current.reset()
      }, 800)

    } catch (error) {
      alert('Gagal upload foto. Coba lagi.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
      
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
      >
        <ImagePlus size={48} className={loading ? "text-gray-300" : "text-gray-400 mb-4"} />
        <p className="text-sm font-bold text-gray-700 text-center">
          {loading ? 'Sedang mengunggah...' : 'Klik untuk pilih foto'}
        </p>
        <p className="text-xs text-gray-500 mt-1 text-center">Bisa pilih lebih dari 1 foto sekaligus</p>
      </div>
      
      <input 
        type="file" 
        multiple 
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        disabled={loading}
      />

      {/* PREVIEW FOTO (Thumbnail) */}
      {selectedFiles.length > 0 && !loading && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-3">Foto yang akan diupload ({selectedFiles.length}):</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                    {previewUrls[idx] ? (
                      <img src={previewUrls[idx]} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="m-auto mt-3 text-gray-400" />
                    )}
                  </div>
                  <span className="truncate text-gray-700 font-medium">{file.name}</span>
                </div>
                <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Judul Kenangan (Wajib)</label>
          <input type="text" name="title" disabled={loading} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Misal: Liburan ke Bali" />
        </div>
        
        {/* INPUT TANGGAL BARU */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal Kenangan</label>
          <input 
            type="date" 
            name="manual_date" 
            defaultValue={today} 
            disabled={loading} 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Caption (Opsional)</label>
        <textarea name="caption" disabled={loading} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tulis cerita singkatnya di sini..." />
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-blue-600">
            <span>Mengunggah foto...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || selectedFiles.length === 0}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex justify-center items-center gap-2"
      >
        {loading ? <><Loader2 className="animate-spin" size={20} /> Sedang Mengunggah...</> : 'Upload Sekarang'}
      </button>
    </form>
  )
}