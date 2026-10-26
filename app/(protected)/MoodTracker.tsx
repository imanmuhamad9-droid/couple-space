'use client'

import { useState } from 'react'
import { updateSettings } from '@/app/actions/settings'
import { Smile, Meh, Frown, Heart, Zap } from 'lucide-react'

type MoodTrackerProps = {
  nameA: string
  nameB: string
  initialMoodA: number
  initialMoodB: number
}

export default function MoodTracker({ nameA, nameB, initialMoodA, initialMoodB }: MoodTrackerProps) {
  const [moodA, setMoodA] = useState(initialMoodA)
  const [moodB, setMoodB] = useState(initialMoodB)

  const updateMood = async (person: 'A' | 'B', newMood: number) => {
    const clampedMood = Math.max(0, Math.min(100, newMood))
    
    if (person === 'A') setMoodA(clampedMood)
    else setMoodB(clampedMood)

    const formData = new FormData()
    formData.set(person === 'A' ? 'mood_a' : 'mood_b', clampedMood.toString())
    
    try {
      await updateSettings(formData)
    } catch (error) {
      console.error('Gagal update mood', error)
    }
  }

  const getMoodText = (mood: number) => {
    if (mood >= 80) return { text: "Bahagia! 🥰", icon: <Heart className="text-pink-500" size={12} /> }
    if (mood >= 60) return { text: "Semangat! ✨", icon: <Zap className="text-yellow-500" size={12} /> }
    if (mood >= 40) return { text: "Biasa aja 🙂", icon: <Smile className="text-blue-500" size={12} /> }
    if (mood >= 20) return { text: "Capek 🥺", icon: <Meh className="text-gray-500" size={12} /> }
    return { text: "Butuh peluk 💔", icon: <Frown className="text-red-500" size={12} /> }
  }

  const renderMoodBar = (person: 'A' | 'B', name: string, mood: number) => {
    const moodInfo = getMoodText(mood)
    
    return (
      <div className="bg-white/90 backdrop-blur-sm p-2.5 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-xs md:text-sm text-gray-800 truncate">{name || (person === 'A' ? 'Kamu' : 'Pasangan')}</h3>
          <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 w-fit">
            {moodInfo.icon}
            <span className="text-[9px] md:text-[10px] font-bold text-gray-600">{moodInfo.text}</span>
          </div>
        </div>

        {/* Bar */}
        <div className="relative w-full h-3 md:h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner mt-1">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] transition-all duration-500"
            style={{ width: `${mood}%` }}
          />
        </div>

        {/* Kontrol */}
        <div className="flex justify-between items-center mt-1">
          <button onClick={() => updateMood(person, mood - 10)} className="px-2 py-0.5 md:py-1 bg-red-50 text-red-500 font-bold rounded-lg hover:bg-red-100 transition-colors text-[10px] md:text-xs">-</button>
          <span className="text-[9px] md:text-[10px] font-bold text-gray-400">{mood}%</span>
          <button onClick={() => updateMood(person, mood + 10)} className="px-2 py-0.5 md:py-1 bg-green-50 text-green-600 font-bold rounded-lg hover:bg-green-100 transition-colors text-[10px] md:text-xs">+</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-3">Gimana Perasaan Kamu?</h2>
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {renderMoodBar('A', nameA, moodA)}
        {renderMoodBar('B', nameB, moodB)}
      </div>
    </div>
  )
}