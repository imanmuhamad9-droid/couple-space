import { supabaseAdmin } from '@/lib/supabase-admin'
import MeetingList from './MeetingList'

export const instant = false

export default async function MeetingsPage() {
  const { data: meetings, error } = await supabaseAdmin
    .from('meetings')
    .select(`
      *,
      memories (id, storage_path, caption)
    `)
    .order('start_at', { ascending: true })

  if (error) {
    return <div className="text-red-500">Gagal memuat data: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-gray-800">Jadwal Pertemuan</h2>
        <p className="text-gray-500">Atur waktu buat ketemuan kita.</p>
      </header>

      <MeetingList initialMeetings={meetings || []} />
    </div>
  )
}