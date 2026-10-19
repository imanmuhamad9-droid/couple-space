import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ClientLayout from './ClientLayout'

// Baris ini untuk mematikan peringatan "Blocking Route" di Next.js 15/16
export const instant = false

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  // Kalau nggak ada cookie session (belum login), tendang ke halaman login
  if (!session) {
    redirect('/login')
  }

  // Kalau ada session, tampilkan UI-nya
  return <ClientLayout>{children}</ClientLayout>
}