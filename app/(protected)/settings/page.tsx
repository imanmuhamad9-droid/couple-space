import { supabaseAdmin } from '@/lib/supabase-admin'
import SettingsForm from './SettingsForm'

export const instant = false

export default async function SettingsPage() {
  // Ambil data pengaturan (ID 1)
  const { data: settings, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Abaikan error PGRST116 (data tidak ditemukan) jika database baru
    return <div className="text-red-500">Gagal memuat pengaturan: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-gray-800">Pengaturan</h2>
        <p className="text-gray-500">Atur profil dan momen spesial kalian.</p>
      </header>

      <SettingsForm initialData={settings || null} />
    </div>
  )
}