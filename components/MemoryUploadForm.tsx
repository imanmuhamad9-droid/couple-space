'use client'

import { useState } from 'react'
import { uploadMemories } from '@/app/actions/meetings'
import { UploadCloud, X } from 'lucide-react'

export default function MemoryUploadForm({ 
  meetingId, 
  onClose 
}: { 
  meetingId: number
  onClose: () => void 
}) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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
      await uploadMemories(meetingId, formData)
      onClose()
    } catch (error) {
      console.error(error)
      alert('Gagal upload foto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative">
        <input
          type="file"
          name="files"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <UploadCloud size={32} className="text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-600">Klik untuk pilih foto</p>
        <p className="text-xs text-gray-400">Bisa pilih lebih dari satu</p>
      </div>

      {/* Preview Gambar */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={preview} alt="Preview" className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Catatan Kenangan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Kenangan (Opsional)</label>
        <textarea
          name="caption"
          rows={2}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Misal: Hari ini seru bangettt..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || files.length === 0}
          className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Mengunggah...' : 'Selesai & Simpan'}
        </button>
      </div>
    </form>
  )
}