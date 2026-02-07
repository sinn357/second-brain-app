'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Network, Table, Settings, LayoutTemplate, Menu, X, CalendarDays, Brain, Keyboard, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPortal } from 'react-dom'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const canUseDOM = typeof document !== 'undefined'

  const navItems = [
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/graph', label: 'Graph', icon: Network },
    { href: '/mindmap', label: 'Mindmap', icon: Brain },
    { href: '/templates', label: 'Templates', icon: LayoutTemplate },
    { href: '/db', label: 'Database', icon: Table },
    { href: '/shortcuts', label: 'Shortcuts', icon: Keyboard },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/daily', label: 'Daily', icon: CalendarDays },
    { href: '/dashboard', label: 'Dashboard', icon: Home },
  ]

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 모바일 사이드바 */}
      {canUseDOM && isOpen && createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* 사이드바 */}
          <div className="absolute inset-y-0 left-0 h-[100dvh] w-72 max-w-[85vw] bg-white dark:bg-indigo-900 shadow-xl">
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-indigo-200 dark:border-indigo-800 pt-[env(safe-area-inset-top)]">
                <span className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  Nexus
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* 네비게이션 아이템 */}
              <nav className="flex-1 overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname?.startsWith(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 dark:hover:text-indigo-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
