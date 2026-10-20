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
    if (mood >= 80) return { text: "Lagi bahagia banget! 🥰", icon: <Heart className="text-pink-500" /> }
    if (mood >= 60) return { text: "Lagi semangat nih! ✨", icon: <Zap className="text-yellow-500" /> }
    if (mood >= 40) return { text: "Biasa aja, aman. 🙂", icon: <Smile className="text-blue-500" /> }
    if (mood >= 20) return { text: "Lagi capek ya? 🥺", icon: <Meh className="text-gray-500" /> }
    return { text: "Butuh dipeluk nih... 💔", icon: <Frown className="text-red-500" /> }
  }

  const renderMoodBar = (person: 'A' | 'B', name: string, mood: number) => {
    const moodInfo = getMoodText(mood)
    
    return (
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xl text-gray-800">{name || (person === 'A' ? 'Kamu' : 'Pasangan')}</h3>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            {moodInfo.icon}
            <span className="text-sm font-bold text-gray-700">{moodInfo.text}</span>
          </div>
        </div>

        {/* Bar */}
        <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)] transition-all duration-500"
            style={{ width: `${mood}%` }}
          />
          <span className="absolute right-3 text-xs font-bold text-gray-500 mix-blend-difference text-white">{mood}%</span>
        </div>

        {/* Kontrol */}
        <div className="flex gap-2 justify-end">
          <button onClick={() => updateMood(person, mood - 10)} className="px-4 py-2 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-colors">- Kurang</button>
          <button onClick={() => updateMood(person, mood + 10)} className="px-4 py-2 bg-green-50 text-green-600 font-bold rounded-xl hover:bg-green-100 transition-colors">+ Tambah</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">How are you feeling? 💭</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderMoodBar('A', nameA, moodA)}
        {renderMoodBar('B', nameB, moodB)}
      </div>
    </div>
  )
}