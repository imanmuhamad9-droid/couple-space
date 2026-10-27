'use client'

import { useState, useEffect, useRef } from 'react'
import { uploadMemories } from '@/app/actions/meetings'
import { UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react'

export default function MemoryUploadForm({ meetingId, onClose }: { meetingId: number, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Membuat URL preview
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

      await uploadMemories(meetingId, formData)
      
      clearInterval(interval)
      setProgress(100)
      
      setTimeout(() => {
        onClose()
      }, 500)

    } catch (error) {
      alert('Gagal upload foto. Coba lagi.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      
      {/* Tombol Pilih File */}
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:bg-gray-50'}`}
      >
        <UploadCloud className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-sm text-gray-600 font-bold">Klik untuk pilih foto</p>
      </div>

      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={loading}
        className="hidden" 
      />

      {/* PREVIEW FOTO */}
      {selectedFiles.length > 0 && !loading && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-3">Foto dipilih ({selectedFiles.length}):</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 group">
                {previewUrls[idx] && (
                  <img src={previewUrls[idx]} alt="preview" className="w-full h-full object-cover" />
                )}
                <button 
                  type="button" 
                  onClick={() => removeFile(idx)} 
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">Catatan Kenangan (Opsional)</label>
        <textarea 
          name="caption" 
          rows={3} 
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="Seru juga hari ini..."
        />
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

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          Batal
        </button>
        <button type="submit" disabled={loading || selectedFiles.length === 0} className="px-8 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors disabled:bg-gray-400 flex items-center gap-2">
          {loading ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : 'Selesai & Simpan'}
        </button>
      </div>
    </form>
  )
}