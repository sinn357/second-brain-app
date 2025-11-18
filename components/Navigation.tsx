'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Network, Folder, Table } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/graph', label: 'Graph', icon: Network },
    { href: '/folders', label: 'Folders', icon: Folder },
    { href: '/db', label: 'Database', icon: Table },
  ]

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/notes" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Second Brain</span>
          </Link>

          {/* 네비게이션 링크 */}
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
