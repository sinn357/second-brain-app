'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, FilePlus2, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OutgoingLink {
  id: string
  title: string
  exists: boolean
}

interface OutgoingLinksPanelProps {
  links: OutgoingLink[]
  onCreateMissing?: (title: string) => void
}

export function OutgoingLinksPanel({ links, onCreateMissing }: OutgoingLinksPanelProps) {
  const existing = links.filter((link) => link.exists)
  const missing = links.filter((link) => !link.exists)

  return (
    <div className="panel-soft rounded-xl border border-indigo-200/70 p-3 dark:border-indigo-700/60">
      <div className="mb-3 flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          Outgoing Links
        </h3>
        <span className="text-xs text-indigo-500 dark:text-indigo-300">({links.length})</span>
      </div>

      {links.length === 0 ? (
        <p className="py-4 text-center text-xs text-indigo-500 dark:text-indigo-300">
          이 노트에서 링크한 노트가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {existing.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">연결된 노트</p>
              {existing.map((link) => (
                <Link key={link.id} href={`/notes?noteId=${link.id}`}>
                  <Card className="group flex items-center justify-between p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40">
                    <span className="line-clamp-1 text-sm text-indigo-900 dark:text-indigo-100">
                      {link.title}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Card>
                </Link>
              ))}
            </div>
          ) : null}

          {missing.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">미생성 링크</p>
              {missing.map((link) => (
                <Card
                  key={link.id}
                  className="flex items-center justify-between gap-2 border-amber-200/70 bg-amber-50/60 p-2 dark:border-amber-800/60 dark:bg-amber-950/30"
                >
                  <span className="line-clamp-1 text-sm text-amber-700 dark:text-amber-300">
                    {link.title}
                  </span>
                  {onCreateMissing ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
                      onClick={() => onCreateMissing(link.title)}
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      생성
                    </Button>
                  ) : null}
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
