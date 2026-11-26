import { GantianView } from '@/components/GantianView'
import { listGantian } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function GantianPage() {
  const data = await listGantian()
  return <GantianView {...data} today={todayJakarta()} />
}
