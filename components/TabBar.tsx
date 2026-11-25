'use client'

import { CalendarDays, Database, History, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/rencana', label: 'Rencana', Icon: CalendarDays },
  { href: '/histori', label: 'Histori', Icon: History },
  { href: '/database', label: 'Database', Icon: Database },
  { href: '/uang', label: 'Uang', Icon: Wallet },
]

export function TabBar() {
  const path = usePathname()
  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-[430px] grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${active ? 'text-upload' : 'text-muted'}`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
