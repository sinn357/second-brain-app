import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { tagUpdateSchema } from '@/lib/validations/tag'
import { prisma } from '@/lib/db'

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

// GET /api/tags/[id]/notes - 태그별 노트 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const noteTags = await prisma.noteTag.findMany({
      where: { tagId: id },
      include: {
        note: {
          include: {
            folder: true,
          },
        },
      },
    })

    const notes = noteTags.map((nt) => nt.note)

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('GET /api/tags/[id]/notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tags/[id] - 태그 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Zod 검증
    const validated = tagUpdateSchema.safeParse(body)
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

    const tag = await prisma.tag.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, tag })
  } catch (error: unknown) {
    console.error('PATCH /api/tags/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - 태그 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/tags/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
