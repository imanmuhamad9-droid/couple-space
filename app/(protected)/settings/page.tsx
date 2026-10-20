import { supabaseAdmin } from '@/lib/supabase-admin'
import SettingsForm from './SettingsForm'

export const instant = false

export default async function SettingsPage() {
  const { data: settings, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return <div className="text-red-500">Gagal memuat pengaturan: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header dihapus karena udah ada di ClientLayout atau biarin aja satu aja */}
      <SettingsForm initialData={settings || null} />
    </div>
  )
}