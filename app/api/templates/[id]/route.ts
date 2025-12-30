import { NextResponse } from 'next/server'
import { templateUpdateSchema } from '@/lib/validations/template'
import { prisma } from '@/lib/db'

// PATCH /api/templates/[id] - 템플릿 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Zod 검증
    const validated = templateUpdateSchema.safeParse(body)
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

    const template = await prisma.template.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('PATCH /api/templates/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - 템플릿 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.template.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/templates/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
