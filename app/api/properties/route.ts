import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { propertySchema } from '@/lib/validations/property'
import { prisma } from '@/lib/db'

// GET /api/properties - 속성 목록 조회
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, properties })
  } catch (error) {
    console.error('GET /api/properties error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/properties - 속성 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = propertySchema.safeParse(body)
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

    // options가 null인 경우 Prisma.JsonNull로 변환
    const createData = {
      ...data,
      ...(data.options !== undefined && {
        options: data.options === null ? Prisma.JsonNull : data.options
      })
    }

    const property = await prisma.property.create({
      data: createData,
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, property }, { status: 201 })
  } catch (error) {
    console.error('POST /api/properties error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
