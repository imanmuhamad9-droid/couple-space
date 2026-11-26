import { KegiatanList } from '@/components/KegiatanList'
import { jamSelesai, listDompet, listKegiatan, listTempatRingkas } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function RencanaPage() {
  const today = todayJakarta()
  const [items, tempat, dompet, selesai] = await Promise.all([
    listKegiatan('rencana'),
    listTempatRingkas(),
    listDompet(),
    jamSelesai(today),
  ])
  return <KegiatanList mode="rencana" items={items} today={today} tempat={tempat} dompet={dompet} selesaiHariIni={selesai} />
}
