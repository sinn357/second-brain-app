import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/notes/[id]/versions - 버전 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 노트 존재 확인
    const note = await prisma.note.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // 버전 목록 조회 (최신순, body 제외)
    const versions = await prisma.noteVersion.findMany({
      where: { noteId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        title: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, versions })
  } catch (error) {
    console.error('GET /api/notes/[id]/versions error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
