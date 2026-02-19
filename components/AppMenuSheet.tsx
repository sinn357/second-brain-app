'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Home,
  Keyboard,
  LayoutTemplate,
  Network,
  Search,
  Settings,
  Table,
  CalendarDays,
  Calendar,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShortcutHelpButton } from '@/components/ShortcutHelpButton'
import { useTheme } from '@/lib/hooks/useTheme'

const primaryItems = [
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/daily', label: 'Daily', icon: CalendarDays },
  { href: '/weekly', label: 'Weekly', icon: CalendarDays },
  { href: '/monthly', label: 'Monthly', icon: Calendar },
  { href: '/graph', label: 'Graph', icon: Network },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/db', label: 'Database', icon: Table },
  { href: '/shortcuts', label: 'Shortcuts', icon: Keyboard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const secondaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
]

export function AppMenuSheet() {
  const pathname = usePathname()
  const { theme, toggleTheme, mounted } = useTheme()
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const [isOpen, setIsOpen] = useState(false)

  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-indigo-200 bg-white/90 text-indigo-900 shadow-sm backdrop-blur dark:border-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-100"
          aria-label="메뉴 열기"
        >
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline">메뉴</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="text-indigo-900 dark:text-indigo-100">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClick}
              className="flex-1 justify-between border-indigo-200 dark:border-indigo-700"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </span>
              <kbd className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-800 rounded">
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

          <nav className="space-y-1">
            {primaryItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                      : 'text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-400 px-3 pb-2">
              More
            </div>
            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100'
                        : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-100'
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
      </SheetContent>
    </Sheet>
  )
}
