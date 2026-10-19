import { supabaseAdmin } from '@/lib/supabase-admin'
import { format, differenceInDays, addYears, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { Calendar, MapPin, Heart, ArrowRight } from 'lucide-react'
import DashboardGallery from './DashboardGallery'
import MeetingThumbnails from './MeetingThumbnails'

export const instant = false

export default async function DashboardPage() {
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
    if (isAfter(now, nextAnniv)) {
      nextAnniv = addYears(nextAnniv, 1)
    }
    
    daysToAnniversary = differenceInDays(nextAnniv, now)
    nextAnniversaryYear = nextAnniv.getFullYear() - annivDate.getFullYear()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Hi, {settings?.partner_a_name || 'Kamu'} & {settings?.partner_b_name || 'Pasangan'}!
          </h2>
          <p className="text-gray-500 font-medium mt-1">Senang melihatmu lagi.</p>
        </div>
        <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center text-xl font-bold text-pink-700 shadow-inner">
          {settings?.partner_a_name?.[0] || 'U'}
        </div>
      </header>

      {/* CARD ROMANTIS (Hitungan Hari) */}
      {settings?.anniversary_date && (
        <div className="bg-gradient-to-br from-pink-500 via-rose-400 to-pink-400 text-white p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-sm font-semibold text-pink-100 mb-1 flex items-center justify-center md:justify-start gap-2 uppercase tracking-wide">
              <Heart size={16} fill="currentColor" /> Kita sudah bersama
            </h3>
            <div className="text-6xl font-extrabold mb-2 tracking-tighter drop-shadow-sm">{daysTogether} <span className="text-2xl font-semibold drop-shadow-none">Hari</span></div>
            <p className="text-pink-50 font-medium">
              Sejak {format(new Date(settings.anniversary_date), 'dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
          
          <div className="relative z-10 bg-white/20 backdrop-blur-md border border-white/30 p-5 rounded-3xl text-center min-w-[160px]">
            <p className="text-xs text-white font-semibold mb-1 uppercase tracking-wide">Anniversary ke-{nextAnniversaryYear}</p>
            <div className="text-3xl font-bold">{daysToAnniversary} <span className="text-sm font-medium">Hari lagi</span></div>
          </div>
          
          <div className="absolute -right-10 -bottom-10 text-white/10">
            <Heart size={220} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Card Pertemuan Terdekat */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-pink-50 relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-pink-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Calendar size={18} /> Jadwal Terdekat
          </h3>
          
          {nextMeeting ? (
            <div>
              <div className="text-3xl font-extrabold text-gray-800 mb-2">{nextMeeting.title}</div>
              <p className="text-gray-600 font-medium">
                {format(new Date(nextMeeting.start_at), 'EEEE, dd MMMM yyyy - HH:mm', { locale: localeId })}
              </p>
              {nextMeeting.location && <p className="text-sm text-gray-500 mt-2 flex items-center gap-1 font-medium"><MapPin size={14}/> {nextMeeting.location}</p>}
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-gray-400 mb-2">Belum ada jadwal</div>
              <Link href="/meetings" className="text-sm font-bold text-pink-600 hover:underline flex items-center gap-1">
                Buat jadwal baru <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 text-pink-50 opacity-50 group-hover:scale-110 transition-transform">
          <Calendar size={120} />
        </div>
      </div>

      {/* Grid 4 Jadwal Terdekat Lainnya */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Jadwal Selanjutnya</h3>
        {otherUpcoming && otherUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherUpcoming.map((meeting) => (
              <div key={meeting.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 text-lg">{meeting.title}</h4>
                  <p className="text-sm font-medium text-pink-500">
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

      {/* Card Foto Terbaru (Slider) */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Foto Terbaru</h3>
          <Link href="/memories" className="text-sm font-bold text-pink-500 hover:text-pink-600 hover:underline">Lihat Semua</Link>
        </div>
        <div className="flex-1">
          <DashboardGallery memories={recentMemories || []} />
        </div>
      </div>
    </div>
  )
}