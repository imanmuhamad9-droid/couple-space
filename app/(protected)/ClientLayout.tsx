'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Map, Image as ImageIcon, Settings, LogOut } from 'lucide-react'

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
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white p-6 border-r border-gray-100 justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-10 tracking-tight">Our Space.</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                    isActive ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-2xl transition-colors hover:bg-red-50 text-red-600 mt-auto"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-4 pb-safe">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? 'text-black' : 'text-gray-400'
              }`}
            >
              <item.icon size={22} />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}