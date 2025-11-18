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
      },
    })

    // 모든 링크 조회 (엣지)
    const links = await prisma.link.findMany({
      select: {
        id: true,
        sourceId: true,
        targetId: true,
      },
    })

    // D3.js 형식으로 변환
    const nodes = notes.map((note) => ({
      id: note.id,
      title: note.title,
      folderId: note.folderId,
    }))

    const edges = links.map((link) => ({
      id: link.id,
      source: link.sourceId,
      target: link.targetId,
    }))

    return NextResponse.json({
      success: true,
      graph: {
        nodes,
        edges,
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
