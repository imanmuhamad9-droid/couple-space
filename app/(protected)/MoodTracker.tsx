'use client'

import { useState } from 'react'
import { updateSettings } from '@/app/actions/settings'
import { Smile, Frown, X } from 'lucide-react'

type MoodTrackerProps = {
  nameA: string
  nameB: string
  initialMoodA: number
  initialMoodB: number
  avatarA?: string
  avatarB?: string
}

export default function MoodTracker({ nameA, nameB, initialMoodA, initialMoodB, avatarA, avatarB }: MoodTrackerProps) {
  const [moodA, setMoodA] = useState(initialMoodA)
  const [moodB, setMoodB] = useState(initialMoodB)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleMoodChange = async (person: 'a' | 'b', value: number) => {
    if (person === 'a') setMoodA(value)
    else setMoodB(value)

    const formData = new FormData()
    formData.set(`mood_${person}`, value.toString())
    
    try {
      await updateSettings(formData)
    } catch (error) {
        console.error('Gagal update mood', error)
    }
  }

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div className="w-full">
      
      {/* CSS KHUSUS UNTUK MEMAKSA GARIS SLIDER MUNCUL */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]:focus {
          outline: none;
        }
        /* GARIS LATAR BELAKANG (TRACK) */
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #e5e7eb; /* Warna abu-abu (gray-200) */
          border-radius: 8px;
        }
        input[type=range]::-moz-range-track {
          width: 100%;
          height: 8px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 8px;
        }
        /* BULATAN (THUMB) */
        input[type=range]::-webkit-slider-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6; /* Warna biru default */
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type=range]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        /* Khusus warna track untuk Aden (Biru) */
        .slider-a::-webkit-slider-thumb { background: #3b82f6; }
        .slider-a::-moz-range-thumb { background: #3b82f6; }
        /* Khusus warna track untuk Akil (Pink) */
        .slider-b::-webkit-slider-thumb { background: #ec4899; }
        .slider-b::-moz-range-thumb { background: #ec4899; }
      `}} />

      {/* POPUP FOTO PROFIL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Profile" className="w-full h-auto rounded-3xl shadow-2xl object-contain max-h-[80vh]" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KARTU MOOD ADEN */}
        <div className="bg-white p-4 md:p-5 rounded-3xl border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3">
            
            <div 
              onClick={() => avatarA && setSelectedImage(avatarA)}
              className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 ${avatarA ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'bg-blue-500 flex items-center justify-center text-white font-bold text-lg'}`}
            >
              {avatarA ? (
                <img src={avatarA} alt={nameA} className="w-full h-full object-cover" />
              ) : (
                getInitial(nameA)
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{nameA}</h3>
              <p className="text-xs text-gray-500 font-medium">
                {moodA < 30 ? 'Lagi Sedih 😢' : moodA < 70 ? 'Biasa Aja 😐' : 'Bahagia! 🥳'}
              </p>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="flex items-center gap-3">
            <Frown size={18} className="text-gray-400" />
            <input 
              type="range" min="0" max="100" value={moodA} 
              onChange={(e) => handleMoodChange('a', parseInt(e.target.value))}
              className="flex-1 appearance-none cursor-pointer slider-a"
            />
            <Smile size={18} className="text-blue-500" />
          </div>
        </div>

        {/* KARTU MOOD AKIL */}
        <div className="bg-white p-4 md:p-5 rounded-3xl border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3">
            
            <div 
              onClick={() => avatarB && setSelectedImage(avatarB)}
              className={`w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 ${avatarB ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'bg-pink-500 flex items-center justify-center text-white font-bold text-lg'}`}
            >
              {avatarB ? (
                <img src={avatarB} alt={nameB} className="w-full h-full object-cover" />
              ) : (
                getInitial(nameB)
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-800 leading-tight">{nameB}</h3>
              <p className="text-xs text-gray-500 font-medium">
                {moodB < 30 ? 'Lagi Sedih 😢' : moodB < 70 ? 'Biasa Aja 😐' : 'Bahagia! 🥳'}
              </p>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="flex items-center gap-3">
            <Frown size={18} className="text-gray-400" />
            <input 
              type="range" min="0" max="100" value={moodB} 
              onChange={(e) => handleMoodChange('b', parseInt(e.target.value))}
              className="flex-1 appearance-none cursor-pointer slider-b"
            />
            <Smile size={18} className="text-pink-500" />
          </div>
        </div>
      </div>
    </div>
  )
}