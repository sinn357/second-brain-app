import { NextResponse } from 'next/server'
import { noteUpdateSchema } from '@/lib/validations/note'
import { prisma } from '@/lib/db'

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

    return NextResponse.json({ success: true, note })
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

    // 노트 업데이트
    const note = await prisma.note.update({
      where: { id },
      data,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('PATCH /api/notes/[id] error:', error)

    if (error.code === 'P2025') {
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
  } catch (error: any) {
    console.error('DELETE /api/notes/[id] error:', error)

    if (error.code === 'P2025') {
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
