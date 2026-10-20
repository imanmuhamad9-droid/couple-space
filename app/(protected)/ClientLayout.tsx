'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Image as ImageIcon, Settings, LogOut } from 'lucide-react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Meetings', path: '/meetings', icon: Calendar },
    { name: 'Memories', path: '/memories', icon: ImageIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/login/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error(error)
    }
  }

  return (
    // Pakai class 'bg-paper-texture' dari globals.css
    <div className="flex h-screen transition-colors duration-500 bg-paper-texture">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white/90 backdrop-blur-md p-6 border-r border-gray-100 justify-between rounded-r-3xl shadow-sm">
        <div>
                    <h1 className="text-3xl font-black mb-10 tracking-tighter text-[var(--theme-primary)] font-slab">Our Space</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 font-bold ${
                    isActive 
                      ? 'bg-[var(--theme-primary)] text-white shadow-md' 
                      : 'hover:bg-[var(--theme-primary-light)] text-gray-500 hover:text-[var(--theme-primary)]'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-red-50 text-red-500 font-bold mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

            {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10">
        {/* Tambahkan relative z-10 di sini */}
        <div className="relative z-10 w-full max-w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile (Solid Putih) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around p-3 z-50">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-[var(--theme-primary)]' : 'text-gray-400 hover:text-[var(--theme-primary)]'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}