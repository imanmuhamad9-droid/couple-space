import { supabaseAdmin } from '@/lib/supabase-admin'
import { format, differenceInDays, addYears, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'
import { Calendar, MapPin, Heart } from 'lucide-react'
import DashboardGallery from './DashboardGallery'
import MeetingThumbnails from './MeetingThumbnails'

export const instant = false

export default async function DashboardPage() {
  const now = new Date()
  const nowString = now.toISOString()

  // 1. Ambil 5 jadwal terdekat
  const { data: upcomingMeetings } = await supabaseAdmin
    .from('meetings')
    .select(`*, memories (id, storage_path)`)
    .gte('start_at', nowString)
    .eq('status', 'planned')
    .order('start_at', { ascending: true })
    .limit(5)

  const nextMeeting = upcomingMeetings?.[0]
  const otherUpcoming = upcomingMeetings?.slice(1, 5)

  // 2. Ambil 5 foto terbaru
  const { data: recentMemories } = await supabaseAdmin
    .from('memories')
    .select('id, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // 3. Ambil Data Settings (Nama & Tanggal Jadian)
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  // 4. LOGIKA HITUNG HARI & ANNIVERSARY
  let daysTogether = 0
  let daysToAnniversary = 0
  let nextAnniversaryYear = 0

  if (settings?.anniversary_date) {
    const annivDate = new Date(settings.anniversary_date)
    
    // Hitung sudah berapa lama bareng
    daysTogether = differenceInDays(now, annivDate)

    // Hitung mundur ke anniversary tahun depan (atau tahun ini kalau belum lewat)
    let nextAnniv = new Date(now.getFullYear(), annivDate.getMonth(), annivDate.getDate())
    if (isAfter(now, nextAnniv)) {
      nextAnniv = addYears(nextAnniv, 1)
    }
    
    daysToAnniversary = differenceInDays(nextAnniv, now)
    nextAnniversaryYear = nextAnniv.getFullYear() - annivDate.getFullYear()
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-gray-800">
          Hi, {settings?.partner_a_name || 'Kamu'} & {settings?.partner_b_name || 'Pasangan'}!
        </h2>
        <p className="text-gray-500">Ini ringkasan jadwal dan momen kita.</p>
      </header>

      {/* CARD ROMANTIS (Hitungan Hari) */}
      {settings?.anniversary_date && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-sm font-medium text-pink-100 mb-1 flex items-center justify-center md:justify-start gap-2">
              <Heart size={16} fill="currentColor" /> Kita sudah bersama selama
            </h3>
            <div className="text-5xl font-bold mb-1">{daysTogether} <span className="text-2xl font-normal">Hari</span></div>
            <p className="text-pink-100 text-sm">
              Sejak {format(new Date(settings.anniversary_date), 'dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
          
          <div className="relative z-10 bg-white/20 backdrop-blur-sm p-4 rounded-2xl text-center min-w-[150px]">
            <p className="text-xs text-white mb-1">Menuju Anniversary ke-{nextAnniversaryYear}</p>
            <div className="text-2xl font-bold">{daysToAnniversary} <span className="text-sm font-normal">Hari lagi</span></div>
          </div>
          
          {/* Aksen Background */}
          <div className="absolute -right-10 -bottom-10 text-white/10">
            <Heart size={200} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Card Pertemuan Terdekat */}
      <div className="bg-black text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <Calendar size={16} /> Pertemuan Berikutnya
          </h3>
          
          {nextMeeting ? (
            <div>
              <div className="text-3xl font-bold mb-1">{nextMeeting.title}</div>
              <p className="text-gray-300">
                {format(new Date(nextMeeting.start_at), 'EEEE, dd MMMM yyyy - HH:mm', { locale: localeId })}
              </p>
              {nextMeeting.location && <p className="text-sm text-gray-400 mt-2 flex items-center gap-1"><MapPin size={14}/> {nextMeeting.location}</p>}
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold mb-2">Belum ada jadwal</div>
              <Link href="/meetings" className="text-sm font-medium text-blue-400 hover:underline">
                Buat jadwal baru →
              </Link>
            </div>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 text-white/5">
          <Calendar size={200} />
        </div>
      </div>

      {/* Grid 4 Jadwal Terdekat Lainnya */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Jadwal Selanjutnya</h3>
        {otherUpcoming && otherUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherUpcoming.map((meeting) => (
              <div key={meeting.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800 text-lg">{meeting.title}</h4>
                  <p className="text-sm text-gray-500">
                    {format(new Date(meeting.start_at), 'dd MMM yyyy - HH:mm', { locale: localeId })}
                  </p>
                  {meeting.location && <p className="text-xs text-gray-400 mt-1">📍 {meeting.location}</p>}
                </div>
                <div className="mt-auto">
                  <MeetingThumbnails memories={meeting.memories || []} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Belum ada jadwal lain yang direncanakan.</p>
        )}
      </div>

      {/* Card Foto Terbaru (Slider) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Foto Terbaru</h3>
          <Link href="/memories" className="text-sm text-blue-600 hover:underline">Lihat Semua</Link>
        </div>
        <div className="flex-1">
          <DashboardGallery memories={recentMemories || []} />
        </div>
      </div>
    </div>
  )
}