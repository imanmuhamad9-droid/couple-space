import { TempatList } from '@/components/TempatList'
import { listTempat } from '@/lib/data'

export const dynamic = 'force-dynamic'

export default async function DatabasePage() {
  const items = await listTempat()
  return <TempatList items={items} />
}
