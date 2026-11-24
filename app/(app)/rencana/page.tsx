import { KegiatanList } from '@/components/KegiatanList'
import { listKegiatan } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RencanaPage() {
  const items = await listKegiatan('rencana')
  return <KegiatanList mode="rencana" items={items} today={todayJakarta()} />
}
