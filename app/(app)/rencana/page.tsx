import { KegiatanList } from '@/components/KegiatanList'
import { listKegiatan, listTempatRingkas } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RencanaPage() {
  const [items, tempat] = await Promise.all([listKegiatan('rencana'), listTempatRingkas()])
  return <KegiatanList mode="rencana" items={items} today={todayJakarta()} tempat={tempat} />
}
