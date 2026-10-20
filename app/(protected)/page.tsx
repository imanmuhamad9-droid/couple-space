import { supabaseAdmin } from '@/lib/supabase-admin'
import { format, differenceInDays, addYears, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { Calendar, MapPin, Heart, ArrowRight, Clock } from 'lucide-react'
import DashboardGallery from './DashboardGallery'
import MeetingThumbnails from './MeetingThumbnails'
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
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Hi, {settings?.partner_a_name || 'Kamu'} & {settings?.partner_b_name || 'Pasangan'}!
        </h2>
        <p className="text-gray-500 font-medium mt-1">Senang melihatmu lagi.</p>
      </header>

      {settings?.anniversary_date && (
        <div className="bg-gradient-to-br from-[var(--theme-gradient-from)] via-[var(--theme-primary)] to-[var(--theme-gradient-to)] text-white p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-500">
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-sm font-bold text-white/80 mb-1 flex items-center justify-center md:justify-start gap-2 uppercase tracking-wide">
              <Heart size={16} fill="currentColor" /> Kita sudah bersama
            </h3>
            <div className="text-6xl font-extrabold mb-2 tracking-tighter drop-shadow-sm">{daysTogether} <span className="text-2xl font-semibold drop-shadow-none">Hari</span></div>
            <p className="text-white/90 font-medium">
              Sejak {format(new Date(settings.anniversary_date), 'dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
          
          <div className="relative z-10 bg-white/20 backdrop-blur-md border border-white/30 p-5 rounded-3xl text-center min-w-[160px]">
            <p className="text-xs text-white font-bold mb-1 uppercase tracking-wide">Anniversary ke-{nextAnniversaryYear}</p>
            <div className="text-3xl font-bold">{daysToAnniversary} <span className="text-sm font-medium">Hari lagi</span></div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 text-white/10">
            <Heart size={220} fill="currentColor" />
          </div>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-[var(--theme-primary)] mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Calendar size={18} /> Jadwal Terdekat
          </h3>
          
          {nextMeeting ? (
            <div>
              <div className="text-3xl font-extrabold text-gray-800 mb-2">{nextMeeting.title}</div>
              
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <p className="text-gray-600 font-medium">
                  {format(new Date(nextMeeting.start_at), 'EEEE, dd MMMM yyyy - HH:mm', { locale: localeId })}
                </p>
                <div className="flex items-center gap-1.5 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full text-xs font-bold border border-pink-100">
                  <Clock size={14} /> {meetingCountdown}
                </div>
              </div>

              {nextMeeting.location && <p className="text-sm text-gray-500 mt-2 flex items-center gap-1 font-medium"><MapPin size={14}/> {nextMeeting.location}</p>}
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-gray-400 mb-2">Belum ada jadwal</div>
              <Link href="/meetings" className="text-sm font-bold text-[var(--theme-primary)] hover:underline flex items-center gap-1">
                Buat jadwal baru <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 text-[var(--theme-primary-light)] opacity-50 group-hover:scale-110 transition-transform">
          <Calendar size={120} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Jadwal Selanjutnya</h3>
        {otherUpcoming && otherUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherUpcoming.map((meeting) => (
              <div key={meeting.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-lg">{meeting.title}</h4>
                  <p className="text-sm font-medium text-[var(--theme-primary)]">
                    {format(new Date(meeting.start_at), 'dd MMM yyyy - HH:mm', { locale: localeId })}
                  </p>
                  {meeting.location && <p className="text-xs text-gray-400 mt-1 font-medium">📍 {meeting.location}</p>}
                </div>
                <div className="mt-auto">
                  <MeetingThumbnails memories={meeting.memories || []} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic bg-white p-6 rounded-2xl border border-dashed border-gray-200">Belum ada jadwal lain yang direncanakan.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Foto Terbaru</h3>
          <Link href="/memories" className="text-sm font-bold text-[var(--theme-primary)] hover:opacity-80 hover:underline">Lihat Semua</Link>
        </div>
        <div className="flex-1">
          <DashboardGallery memories={recentMemories || []} />
        </div>
      </div>
    </div>
  )
}