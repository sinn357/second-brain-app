'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Network, Table, Search, Moon, Sun, CalendarDays, Settings, LayoutTemplate, Brain, Keyboard, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/useTheme'
import { MobileNav } from '@/components/MobileNav'

export function Navigation() {
  const pathname = usePathname()
  const [isMac, setIsMac] = useState(false)
  const { theme, toggleTheme, mounted } = useTheme()

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'))
  }, [])

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

  const handleSearchClick = () => {
    // Trigger Cmd+K event
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <nav className="bg-white dark:bg-indigo-900 border-b border-indigo-200 dark:border-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 모바일 햄버거 메뉴 */}
          <div className="md:hidden">
            <MobileNav />
          </div>

          {/* 로고 */}
          <Link href="/notes" className="flex items-center">
            <span className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Second Brain</span>
          </Link>

          {/* 데스크톱 네비게이션 링크 */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800 dark:hover:text-indigo-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {/* Command Palette 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClick}
              className="ml-4 flex items-center gap-2 border-indigo-300 dark:border-indigo-700"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline text-sm text-indigo-700 dark:text-indigo-300">Search</span>
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-800 rounded">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </Button>

            {/* 다크모드 토글 버튼 */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="ml-2 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
