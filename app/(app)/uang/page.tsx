import { UangView } from '@/components/UangView'
import { listDompet, listTransaksi } from '@/lib/data'
import { todayJakarta } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function UangPage() {
  const [items, dompet] = await Promise.all([listTransaksi(), listDompet()])
  return <UangView items={items} dompet={dompet} today={todayJakarta()} />
}
