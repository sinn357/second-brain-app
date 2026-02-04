import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createNoteVersion } from '@/lib/versionUtils'

// POST /api/notes/[id]/versions/[versionId]/restore - 버전 복원
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params

    // 복원할 버전 조회
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

    // 현재 노트 조회
    const currentNote = await prisma.note.findUnique({
      where: { id },
      select: { title: true, body: true },
    })

    if (!currentNote) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    // 복원 전 현재 상태를 버전으로 저장
    await createNoteVersion(id, currentNote.title, currentNote.body)

    // 노트를 선택한 버전으로 복원
    const note = await prisma.note.update({
      where: { id },
      data: {
        title: version.title,
        body: version.body,
      },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      note,
      message: `Restored to version ${version.version}`,
    })
  } catch (error) {
    console.error('POST /api/notes/[id]/versions/[versionId]/restore error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
