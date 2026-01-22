import { NextResponse } from 'next/server'
import { folderSchema } from '@/lib/validations/folder'
import { prisma } from '@/lib/db'

async function ensureDefaultFolder() {
  const existingDefault = await prisma.folder.findFirst({
    where: { isDefault: true },
  })

  if (existingDefault) {
    return existingDefault
  }

  const existingMemo = await prisma.folder.findFirst({
    where: { name: '메모', parentId: null },
  })

  if (existingMemo) {
    await prisma.$transaction([
      prisma.folder.updateMany({
        where: { parentId: null, id: { not: existingMemo.id } },
        data: { position: { increment: 1 } },
      }),
      prisma.folder.update({
        where: { id: existingMemo.id },
        data: { isDefault: true, position: 0 },
      }),
    ])
    return prisma.folder.findUnique({ where: { id: existingMemo.id } })
  }

  const [, defaultFolder] = await prisma.$transaction([
    prisma.folder.updateMany({
      where: { parentId: null },
      data: { position: { increment: 1 } },
    }),
    prisma.folder.create({
      data: {
        name: '메모',
        parentId: null,
        position: 0,
        isDefault: true,
      },
    }),
  ])

  return defaultFolder
}

// GET /api/folders - 폴더 트리 조회
export async function GET() {
  try {
    await ensureDefaultFolder()
    const folders = await prisma.folder.findMany({
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
      include: {
        children: true,
        _count: {
          select: {
            notes: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, folders })
  } catch (error) {
    console.error('GET /api/folders error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/folders - 폴더 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Zod 검증
    const validated = folderSchema.safeParse(body)
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

    const folder = await prisma.folder.create({
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

    return NextResponse.json({ success: true, folder }, { status: 201 })
  } catch (error) {
    console.error('POST /api/folders error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
