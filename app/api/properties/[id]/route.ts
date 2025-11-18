import { NextResponse } from 'next/server'
import { propertyUpdateSchema } from '@/lib/validations/property'
import { prisma } from '@/lib/db'

// PATCH /api/properties/[id] - 속성 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Zod 검증
    const validated = propertyUpdateSchema.safeParse(body)
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

    const property = await prisma.property.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, property })
  } catch (error: any) {
    console.error('PATCH /api/properties/[id] error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/properties/[id] - 속성 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.property.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/properties/[id] error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
