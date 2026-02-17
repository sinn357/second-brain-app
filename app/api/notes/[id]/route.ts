import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { noteUpdateSchema } from '@/lib/validations/note'
import { prisma } from '@/lib/db'
import { createNoteVersion } from '@/lib/versionUtils'

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

function sanitizeNote<T extends { lockHash?: string | null }>(note: T): Omit<T, 'lockHash'> {
  const safe = { ...note } as T
  delete safe.lockHash
  return safe as Omit<T, 'lockHash'>
}

// GET /api/notes/[id] - 노트 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
        linksFrom: {
          include: {
            target: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        linksTo: {
          include: {
            source: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        properties: {
          include: {
            property: true,
          },
        },
      },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, note: sanitizeNote(note) })
  } catch (error) {
    console.error('GET /api/notes/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/notes/[id] - 노트 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Zod 검증
    const validated = noteUpdateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validated.error.format()
        },
        { status: 400 }
      )
    }

    const data = validated.data

    // 내용 변경 시 버전 생성 (title 또는 body 변경)
    if (data.title !== undefined || data.body !== undefined) {
      const currentNote = await prisma.note.findUnique({
        where: { id },
        select: { title: true, body: true },
      })

      if (currentNote) {
        const titleChanged = data.title !== undefined && data.title !== currentNote.title
        const bodyChanged = data.body !== undefined && data.body !== currentNote.body

        if (titleChanged || bodyChanged) {
          await createNoteVersion(id, currentNote.title, currentNote.body)
        }
      }
    }

    const updateData = {
      ...data,
      ...(typeof data.isPinned === 'boolean'
        ? { pinnedAt: data.isPinned ? new Date() : null }
        : {}),
    }

    // 노트 업데이트
    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, note: sanitizeNote(note) })
  } catch (error: unknown) {
    console.error('PATCH /api/notes/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] - 노트 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/notes/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
