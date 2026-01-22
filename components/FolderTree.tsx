'use client'

import { useFolders } from '@/lib/hooks/useFolders'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  position: number
  children?: FolderNode[]
  _count?: {
    notes: number
  }
}

function FolderItem({ folder, level = 0 }: { folder: FolderNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = folder.children && folder.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-800/60"
        style={{ paddingLeft: `${level * 10 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setIsOpen(!isOpen)} className="p-0.5 text-indigo-500 dark:text-indigo-300">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
        <Link href={`/notes?folderId=${folder.id}`} className="flex-1">
          <span className="text-sm text-indigo-900 dark:text-indigo-100">{folder.name}</span>
        </Link>
        {folder._count && (
          <span className="text-[11px] text-indigo-500 dark:text-indigo-300">{folder._count.notes}</span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div>
          {folder.children?.map((child) => (
            <FolderItem key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree() {
  const { data: folders = [], isLoading, error } = useFolders()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm mb-2">Folders</h3>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Error loading folders
      </div>
    )
  }

  // 최상위 폴더만 필터링 (parentId가 null인 것)
  const rootFolders = folders.filter((f) => f.parentId === null)

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 text-indigo-900 dark:text-indigo-100">Folders</h3>

      {rootFolders.length === 0 ? (
        <p className="text-sm text-indigo-500 dark:text-indigo-300">폴더가 없습니다</p>
      ) : (
        <div className="space-y-1">
          {rootFolders.map((folder) => (
            <FolderItem key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  )
}
