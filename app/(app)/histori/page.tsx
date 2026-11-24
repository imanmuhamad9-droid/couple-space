import { KegiatanList } from '@/components/KegiatanList'
import { listKegiatan, listTempatRingkas } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function HistoriPage() {
  const [items, tempat] = await Promise.all([listKegiatan('terlaksana'), listTempatRingkas()])
  return <KegiatanList mode="histori" items={items} today={todayJakarta()} tempat={tempat} />
}
