import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClientLayout from './ClientLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const instant = false

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    redirect('/login')
  }

  // Ambil tema dari database
  const { data: settings } = await supabaseAdmin.from('settings').select('theme_color').eq('id', 1).single()
  const theme = (settings?.theme_color as any) || 'blue'

  return (
    <ThemeProvider initialTheme={theme}>
      <ClientLayout>{children}</ClientLayout>
    </ThemeProvider>
  )
}