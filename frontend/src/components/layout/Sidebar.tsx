'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Clock, CalendarDays, Tag, Settings, CheckSquare } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/records/new', label: '記録を追加', icon: Clock },
  { href: '/records', label: '履歴一覧', icon: CalendarDays },
  { href: '/todos', label: 'TODO', icon: CheckSquare },
  { href: '/categories', label: 'カテゴリー', icon: Tag },
  { href: '/settings', label: '設定', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-52 min-h-screen bg-white border-r border-gray-100 py-6 px-3 gap-1">
      <div className="text-xl font-semibold text-indigo-500 px-3 pb-4 border-b border-gray-100 mb-2">
        Logly
      </div>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}