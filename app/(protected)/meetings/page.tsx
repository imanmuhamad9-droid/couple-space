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
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight font-slab">Mau Kemana Kita? 🗺️</h2>
        <p className="text-gray-500 font-medium mt-2 text-lg">Tulis semua wishlist kencan kita di sini.</p>
      </header>

      <MeetingList initialMeetings={meetings || []} />
    </div>
  )
}