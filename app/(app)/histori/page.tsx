import { KegiatanList } from '@/components/KegiatanList'
import { listKegiatan } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function HistoriPage() {
  const items = await listKegiatan('terlaksana')
  return <KegiatanList mode="histori" items={items} today={todayJakarta()} />
}
