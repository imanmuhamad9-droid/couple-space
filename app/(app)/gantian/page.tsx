import { GantianView } from '@/components/GantianView'
import { dompetGantian, listDompet, listGantian } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function GantianPage() {
  const [data, dompet, asal] = await Promise.all([listGantian(), listDompet(), dompetGantian()])
  return <GantianView {...data} dompet={asal ? dompet : []} asal={asal ?? {}} today={todayJakarta()} />
}
