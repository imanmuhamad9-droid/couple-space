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
    return <div className="text-red-500">Gagal memuat pengaturan: {error.message}</div>
  }

  return (
    <div className="space-y-6">
            <header>
        <h2 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight font-slab">
          Biodata Kita
        </h2>
        <p className="text-gray-500 font-medium mt-1 text-sm md:text-lg">
          Ubah nama, tanggal jadian, atau warna tema.
        </p>
      </header>

      {/* Ini yang tadi ilang, komponen form-nya */}
      <SettingsForm initialData={settings || null} />
    </div>
  )
}