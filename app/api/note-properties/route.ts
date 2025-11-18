import { NextResponse } from 'next/server'
import { notePropertySchema } from '@/lib/validations/property'
import { prisma } from '@/lib/db'

// POST /api/note-properties - 노트에 속성 값 설정
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = notePropertySchema.safeParse(body)
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

    const { noteId, propertyId, value } = validated.data

    // upsert: 기존 값이 있으면 업데이트, 없으면 생성
    const noteProperty = await prisma.noteProperty.upsert({
      where: {
        noteId_propertyId: {
          noteId,
          propertyId,
        },
      },
      update: {
        value,
      },
      create: {
        noteId,
        propertyId,
        value,
      },
      include: {
        property: true,
      },
    })

    return NextResponse.json({ success: true, noteProperty }, { status: 201 })
  } catch (error) {
    console.error('POST /api/note-properties error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
