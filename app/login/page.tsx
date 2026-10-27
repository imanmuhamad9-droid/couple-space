import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth' // sesuaikan import-nya dengan lokasi file auth.ts kamu
import LoginForm from './LoginForm'

export const instant = false

export default async function LoginPage() {
  // Cek apakah sesinya valid (belum expired 10 menit)
  const isValid = await verifySession()

  // Kalau udah punya sesi valid, lempar ke dashboard
  if (isValid) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-2">Masukkan password untuk membuka ruang kita.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}