'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText, Network, Folder, Table, Search, Moon, Sun,
  Settings, LayoutTemplate, Home, Brain, Keyboard
} from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'

export function FloatingNav() {
  const pathname = usePathname()
  const [isMac, setIsMac] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { theme, toggleTheme, mounted } = useTheme()

  useEffect(() => {
    setIsMac(navigator.platform.includes('Mac'))
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/graph', label: 'Graph', icon: Network },
    { href: '/db', label: 'Database', icon: Table },
    { href: '/mindmap', label: 'Mindmap', icon: Brain },
    { href: '/folders', label: 'Folders', icon: Folder },
    { href: '/templates', label: 'Templates', icon: LayoutTemplate },
    { href: '/shortcuts', label: 'Shortcuts', icon: Keyboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

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
    <>
      {/* Top Header - Minimal */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="relative z-40 px-4 pt-3"
      >
        <div className="max-w-7xl mx-auto glass-strong border border-white/15 px-4 py-3 rounded-2xl flex items-center justify-between">
          {/* Logo */}
          <Link href="/notes" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-10 h-10 rounded-xl gradient-mesh flex items-center justify-center shadow-md"
            >
              <span className="text-white font-bold text-xl">N</span>
            </motion.div>
            <span className="text-2xl font-bold gradient-text">Nexus</span>
          </Link>

          {/* Search & Theme Toggle */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearchClick}
              className="glass px-4 py-2 rounded-full flex items-center gap-2 hover-glow"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs glass-strong rounded">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </motion.button>

            {mounted && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleTheme}
                className="glass w-10 h-10 rounded-full flex items-center justify-center hover-glow"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Floating Dock - Bottom */}
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="glass-strong border border-white/15 px-2 py-2 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ y: -4, scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative w-12 h-12 rounded-xl flex items-center justify-center
                      transition-all duration-200
                      ${isActive
                        ? 'gradient-mesh text-white shadow-md'
                        : 'hover:bg-white/10 text-indigo-200'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />

                    {/* Tooltip */}
                    {hoveredIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 glass-strong px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium"
                      >
                        {item.label}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-inherit rotate-45" />
                      </motion.div>
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </motion.nav>

      {/* Spacer for content */}
      <div className="h-6" />
    </>
  )
}
