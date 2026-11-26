import { KegiatanList } from '@/components/KegiatanList'
import { listDompet, listKegiatan, listTempatRingkas } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RencanaPage() {
  const [items, tempat, dompet] = await Promise.all([listKegiatan('rencana'), listTempatRingkas(), listDompet()])
  return <KegiatanList mode="rencana" items={items} today={todayJakarta()} tempat={tempat} dompet={dompet} />
}
