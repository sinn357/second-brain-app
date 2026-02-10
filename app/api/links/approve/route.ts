import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { approveLinkSchema } from '@/lib/validations/link'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = approveLinkSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validated.error.format(),
        },
        { status: 400 }
      )
    }

    const { noteId, targetIds } = validated.data

    const createData = targetIds
      .filter((targetId) => targetId !== noteId)
      .map((targetId) => ({ sourceId: noteId, targetId }))

    if (createData.length === 0) {
      return NextResponse.json({ success: true, created: 0 })
    }

    const result = await prisma.link.createMany({
      data: createData,
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, created: result.count })
  } catch (error) {
    console.error('POST /api/links/approve error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
