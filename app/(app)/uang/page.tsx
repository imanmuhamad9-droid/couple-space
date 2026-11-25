import { UangView } from '@/components/UangView'
import { listTransaksi } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function UangPage() {
  const items = await listTransaksi()
  return <UangView items={items} today={todayJakarta()} />
}
