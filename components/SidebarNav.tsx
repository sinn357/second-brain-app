'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Brain,
  FileText,
  Home,
  Keyboard,
  LayoutTemplate,
  Network,
  Search,
  Settings,
  Table,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/useTheme'
import { MobileNav } from '@/components/MobileNav'
import { ShortcutHelpButton } from '@/components/ShortcutHelpButton'

const primaryItems = [
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/graph', label: 'Graph', icon: Network },
  { href: '/mindmap', label: 'Mindmap', icon: Brain },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/db', label: 'Database', icon: Table },
  { href: '/shortcuts', label: 'Shortcuts', icon: Keyboard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const secondaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, toggleTheme, mounted } = useTheme()
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')

  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <>
      <header className="lg:hidden border-b sidebar-border sidebar-surface backdrop-blur">
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
        >
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link href="/notes" className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              Nexus
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClick}
              className="flex items-center gap-2 border-indigo-300 dark:border-indigo-700"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Search</span>
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-800 rounded">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </Button>
            <ShortcutHelpButton compact variant="ghost" className="text-indigo-700 dark:text-indigo-300" />
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
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
      </header>

      <aside
        className={`hidden lg:flex flex-col border-r sidebar-border sidebar-surface transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`px-5 py-6 flex items-center ${isCollapsed ? 'flex-col gap-3' : 'justify-between gap-3 flex-wrap'}`}>
          <Link
            href="/notes"
            className="text-2xl font-bold text-indigo-900 dark:text-indigo-100"
            aria-label="Nexus 홈"
          >
            {isCollapsed ? (
              <>
                <span className="sr-only">Nexus</span>
                <span aria-hidden="true">N</span>
              </>
            ) : (
              'Nexus'
            )}
          </Link>
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-2 flex-wrap'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
              aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <ShortcutHelpButton
              compact
              variant="ghost"
              className="text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
            />
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-800"
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

        <div className={`px-4 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchClick}
            className={`border-indigo-300 dark:border-indigo-700 ${
              isCollapsed ? 'w-9 h-9 p-0 justify-center' : 'w-full justify-start gap-2'
            }`}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className={isCollapsed ? 'sr-only' : undefined}>Search</span>
            {!isCollapsed && (
              <kbd className="ml-auto px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-800 rounded">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            )}
          </Button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                    : 'text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-100'
                } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className={isCollapsed ? 'sr-only' : undefined}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-2 pb-4">
          {!isCollapsed && (
            <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-400 px-3 pb-2">
              More
            </div>
          )}
          {secondaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                    : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-100'
                } ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className={isCollapsed ? 'sr-only' : undefined}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
