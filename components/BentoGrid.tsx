'use client'

import { motion } from 'framer-motion'
import { Plus, FileText, BarChart3, Tag, Search, Network } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface BentoCardProps {
  title: string
  icon: React.ReactNode
  className?: string
  children?: React.ReactNode
}

function BentoCard({ title, icon, className = '', children }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`group relative overflow-hidden rounded-2xl p-6 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/5">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">{title}</h3>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

export default function BentoGrid() {
  const [quickNote, setQuickNote] = useState('')

  const handleQuickAdd = () => {
    if (!quickNote.trim()) return
    // TODO: Implement quick note creation
    console.log('Creating note:', quickNote)
    setQuickNote('')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {/* Quick Add - Large */}
      <BentoCard
        title="Quick Add"
        icon={<Plus className="w-5 h-5 text-purple-400" />}
        className="lg:col-span-2 lg:row-span-2"
      >
        <div className="space-y-4">
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Capture your thoughts instantly..."
            className="w-full h-40 p-4 rounded-xl bg-white/5 border border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:border-purple-500/50 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleQuickAdd()
              }
            }}
          />
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Note (⌘ + Enter)
          </button>
        </div>
      </BentoCard>

      {/* Recent Notes - Medium */}
      <BentoCard
        title="Recent Notes"
        icon={<FileText className="w-5 h-5 text-blue-400" />}
        className="lg:col-span-2 lg:row-span-1"
      >
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <p className="text-sm text-gray-800 dark:text-white/80">Note title {i}</p>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">2 hours ago</p>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Stats - Small */}
      <BentoCard
        title="Stats"
        icon={<BarChart3 className="w-5 h-5 text-green-400" />}
        className="lg:col-span-1"
      >
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">247</p>
            <p className="text-xs text-gray-500 dark:text-white/40">Total Notes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">89</p>
            <p className="text-xs text-gray-500 dark:text-white/40">Links</p>
          </div>
        </div>
      </BentoCard>

      {/* Tags Cloud - Small */}
      <BentoCard
        title="Tags"
        icon={<Tag className="w-5 h-5 text-pink-400" />}
        className="lg:col-span-1"
      >
        <div className="flex flex-wrap gap-2">
          {['#ideas', '#meeting', '#journal', '#research'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-700 dark:text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </BentoCard>

      {/* Search - Medium */}
      <BentoCard
        title="Search"
        icon={<Search className="w-5 h-5 text-cyan-400" />}
        className="lg:col-span-2 lg:row-span-1"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search your second brain..."
            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:border-cyan-400/50"
          />
          <div className="space-y-2">
            {['Design system', 'Project roadmap'].map((query) => (
              <div
                key={query}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <span className="text-sm text-gray-800 dark:text-white/80">{query}</span>
                <span className="text-xs text-gray-500 dark:text-white/40">Recent</span>
              </div>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* Graph Preview - Medium */}
      <BentoCard
        title="Graph"
        icon={<Network className="w-5 h-5 text-orange-400" />}
        className="lg:col-span-1"
      >
        <Link
          href="/graph"
          className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          View full graph →
        </Link>
      </BentoCard>
    </div>
  )
}
