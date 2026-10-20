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
    <div className="flex h-screen bg-[var(--theme-primary-light)] transition-colors duration-500">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white p-6 border-r border-gray-100 justify-between rounded-r-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold mb-10 tracking-tight text-[var(--theme-primary)]">Our Space.</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 font-semibold ${
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
          className="flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-red-50 text-red-500 font-semibold mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10">
        <div className="w-full max-w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-lg border border-white/30 shadow-xl flex justify-around p-4 rounded-3xl z-50">
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