import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { folderUpdateSchema } from '@/lib/validations/folder'
import { prisma } from '@/lib/db'

function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

// PATCH /api/folders/[id] - 폴더 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.folder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Default folder cannot be updated' },
        { status: 400 }
      )
    }

    // Zod 검증
    const validated = folderUpdateSchema.safeParse(body)
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

    const folder = await prisma.folder.update({
      where: { id },
      data,
      include: {
        children: true,
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, folder })
  } catch (error: unknown) {
    console.error('PATCH /api/folders/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[id] - 폴더 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.folder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Default folder cannot be deleted' },
        { status: 400 }
      )
    }

    await prisma.folder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/folders/[id] error:', error)

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
