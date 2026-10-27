import { supabaseAdmin } from '@/lib/supabase-admin'
import { format, differenceInDays, addYears, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react'
import DashboardGallery from './DashboardGallery'
import MeetingThumbnails from './MeetingThumbnails'
import MoodTracker from './MoodTracker'
import { connection } from 'next/server'

export const instant = false

export default async function DashboardPage() {
  await connection()
  
  const now = new Date()
  const nowString = now.toISOString()

  const { data: upcomingMeetings } = await supabaseAdmin
    .from('meetings')
    .select(`*, memories (id, storage_path)`)
    .gte('start_at', nowString)
    .eq('status', 'planned')
    .order('start_at', { ascending: true })
    .limit(5)

  const nextMeeting = upcomingMeetings?.[0]
  const otherUpcoming = upcomingMeetings?.slice(1, 5)

  const { data: recentMemories } = await supabaseAdmin
    .from('memories')
    .select('id, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  let daysTogether = 0
  let daysToAnniversary = 0
  let nextAnniversaryYear = 0

  if (settings?.anniversary_date) {
    const annivDate = new Date(settings.anniversary_date)
    daysTogether = differenceInDays(now, annivDate)
    
    let nextAnniv = new Date(now.getFullYear(), annivDate.getMonth(), annivDate.getDate())
    if (isAfter(now, nextAnniv)) nextAnniv = addYears(nextAnniv, 1)
    
    daysToAnniversary = differenceInDays(nextAnniv, now)
    nextAnniversaryYear = nextAnniv.getFullYear() - annivDate.getFullYear()
  }

  let meetingCountdown = ''
  if (nextMeeting) {
    const meetingDate = new Date(nextMeeting.start_at)
    const diffMs = meetingDate.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
    const diffMinutes = Math.floor((diffMs / 1000 / 60) % 60)

    if (diffDays > 0) meetingCountdown = `${diffDays} Hari ${diffHours} Jam lagi`
    else if (diffHours > 0) meetingCountdown = `${diffHours} Jam ${diffMinutes} Menit lagi`
    else meetingCountdown = `${diffMinutes} Menit lagi`
  }

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* HEADER */}
      <header>
        <h2 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight font-slab">
          Hai, {settings?.partner_a_name || 'Kamu'} & {settings?.partner_b_name || 'Sayang'}!
        </h2>
        <p className="text-gray-500 font-medium mt-1 text-sm md:text-lg">Ini jadwal kita hari ini ya</p>
      </header>

      {/* MOOD TRACKER */}
      <MoodTracker 
        nameA={settings?.partner_a_name || 'Kamu'} 
        nameB={settings?.partner_b_name || 'Pasangan'}
        initialMoodA={settings?.mood_a || 50}
        initialMoodB={settings?.mood_b || 50}
        avatarA={settings?.partner_a_avatar || ''}
        avatarB={settings?.partner_b_avatar || ''}
      />

      {/* CARD ROMANTIS (Hitungan Hari) */}
      {settings?.anniversary_date && (
        <div className="bg-gradient-to-br from-[var(--theme-gradient-from)] via-[var(--theme-primary)] to-[var(--theme-gradient-to)] text-white p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6 transition-all duration-500">
          <div className="relative z-10 text-center md:text-left flex-1">
            <h3 className="text-[10px] md:text-sm font-bold text-white/80 mb-1 md:mb-2 uppercase tracking-wider">
              Udah bareng selama
            </h3>
            <div className="text-4xl md:text-6xl font-black mb-1 md:mb-2 tracking-tighter drop-shadow-sm">
              {daysTogether} <span className="text-lg md:text-2xl font-semibold drop-shadow-none">Hari</span>
            </div>
            <p className="text-white/90 font-medium text-xs md:text-base">
              Sejak {format(new Date(settings.anniversary_date), 'dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
          
          <div className="relative z-10 bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl text-center w-full md:w-auto md:min-w-[160px]">
            <p className="text-[9px] md:text-xs text-white font-bold mb-1 uppercase tracking-wide">Anniversary ke-{nextAnniversaryYear}</p>
            <div className="text-xl md:text-3xl font-bold">{daysToAnniversary} <span className="text-xs md:text-sm font-medium">Hari lagi</span></div>
          </div>
        </div>
      )}

      {/* CARD JADWAL TERDEKAT */}
      <div className="bg-white/90 backdrop-blur-sm p-4 md:p-8 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-[10px] md:text-sm font-bold text-[var(--theme-primary)] mb-2 md:mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Calendar size={14} className="md:w-4 md:h-4" /> Nanti Kita Ketemuan
          </h3>
          
          {nextMeeting ? (
            <div>
              <div className="text-xl md:text-3xl font-black text-gray-800 mb-1 md:mb-2">Kita bakal {nextMeeting.title}!</div>
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-3">
                <p className="text-gray-600 font-medium text-xs md:text-base">
                  {/* UBAH FORMAT JADI HH:mm (24 JAM) & TAMBAH WIB */}
                  {format(new Date(nextMeeting.start_at), 'EEEE, dd MMM yyyy - HH:mm', { locale: localeId })} WIB
                </p>
                <div className="flex items-center gap-1 bg-pink-50 text-pink-600 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border border-pink-100">
                  <Clock size={10} className="md:w-3 md:h-3" /> {meetingCountdown}
                </div>
              </div>

              {nextMeeting.location && <p className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-1 font-medium"><MapPin size={12}/> {nextMeeting.location}</p>}
            </div>
          ) : (
            <div>
              <div className="text-lg md:text-2xl font-bold text-gray-400 mb-2">Belum ada rencana nih 😴</div>
              <Link href="/meetings" className="text-xs md:text-sm font-bold text-[var(--theme-primary)] hover:underline flex items-center gap-1">
                Yuk bikin rencana baru <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* NEXT PLAN KITA */}
      <div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">Next Plan Kita ✨</h3>
        {otherUpcoming && otherUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {otherUpcoming.map((meeting) => (
              <div key={meeting.id} className="bg-white/90 backdrop-blur-sm p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-2 md:mb-4">
                  <h4 className="font-bold text-gray-800 text-lg md:text-xl">{meeting.title}</h4>
                  <p className="text-xs md:text-sm font-bold text-[var(--theme-primary)]">
                    {/* UBAH FORMAT JADI HH:mm (24 JAM) & TAMBAH WIB */}
                    {format(new Date(meeting.start_at), 'dd MMM yyyy - HH:mm', { locale: localeId })} WIB
                  </p>
                  {meeting.location && <p className="text-[10px] md:text-xs text-gray-400 mt-1 font-medium">📍 {meeting.location}</p>}
                </div>
                <div className="mt-auto">
                  <MeetingThumbnails memories={meeting.memories || []} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs md:text-sm text-gray-500 italic bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-dashed border-gray-300">Belum ada jadwal lain yang direncanakan.</p>
        )}
      </div>

      {/* GALERI KITA */}
      <div className="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">Galeri Kita 📸</h3>
          <Link href="/memories" className="text-xs md:text-sm font-bold text-[var(--theme-primary)] hover:opacity-80 hover:underline">Lihat Semua</Link>
        </div>
        <div className="flex-1">
          <DashboardGallery memories={recentMemories || []} />
        </div>
      </div>

    </div>
  )
}