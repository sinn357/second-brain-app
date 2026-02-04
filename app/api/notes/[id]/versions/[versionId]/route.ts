import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/notes/[id]/versions/[versionId] - 특정 버전 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params

    const version = await prisma.noteVersion.findFirst({
      where: {
        id: versionId,
        noteId: id,
      },
    })

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, version })
  } catch (error) {
    console.error('GET /api/notes/[id]/versions/[versionId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
