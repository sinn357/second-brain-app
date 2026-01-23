import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/graph - Graph View 데이터 (노드 + 엣지)
export async function GET() {
  try {
    // 모든 노트 조회 (노드)
    const notes = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        folderId: true,
        body: true,
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 모든 폴더 조회
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
      },
    })

    // D3.js 형식으로 변환
    const nodes = notes.map((note) => ({
      id: note.id,
      title: note.title,
      folderId: note.folderId,
      folderName: note.folder?.name || null,
    }))

    const titleToId = new Map(notes.map((note) => [note.title.trim(), note.id]))
    const edgeKeys = new Set<string>()
    const edges: Array<{ id: string; source: string; target: string }> = []
    const unresolvedMap = new Map<
      string,
      { title: string; sources: Array<{ id: string; title: string }> }
    >()

    const linkPattern = /\[\[(.+?)\]\]/g

    notes.forEach((note) => {
      const body = note.body || ''
      const matches = [...body.matchAll(linkPattern)]
      const uniqueTitles = [...new Set(matches.map((m) => m[1].trim()).filter(Boolean))]

      uniqueTitles.forEach((title) => {
        const targetId = titleToId.get(title)
        if (targetId && targetId !== note.id) {
          const key = `${note.id}:${targetId}`
          if (!edgeKeys.has(key)) {
            edgeKeys.add(key)
            edges.push({
              id: key,
              source: note.id,
              target: targetId,
            })
          }
          return
        }

        if (!unresolvedMap.has(title)) {
          unresolvedMap.set(title, { title, sources: [] })
        }
        const entry = unresolvedMap.get(title)
        if (entry && !entry.sources.find((source) => source.id === note.id)) {
          entry.sources.push({ id: note.id, title: note.title })
        }
      })
    })

    const unresolvedNodes = Array.from(unresolvedMap.values()).map((entry) => ({
      id: `missing:${entry.title}`,
      title: entry.title,
      folderId: null,
      folderName: null,
      isMissing: true,
    }))

    const unresolvedEdges = Array.from(unresolvedMap.values()).flatMap((entry) =>
      entry.sources.map((source) => ({
        id: `missing:${source.id}:${entry.title}`,
        source: source.id,
        target: `missing:${entry.title}`,
      }))
    )

    return NextResponse.json({
      success: true,
      graph: {
        nodes: [...nodes, ...unresolvedNodes],
        edges: [...edges, ...unresolvedEdges],
        folders,
        unresolved: Array.from(unresolvedMap.values()),
      }
    })
  } catch (error) {
    console.error('GET /api/graph error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
