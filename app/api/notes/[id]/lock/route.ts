import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const MIN_PASSWORD_LENGTH = 4

function readPassword(input: unknown) {
  if (!input || typeof input !== 'object') return ''
  const candidate = (input as { password?: unknown }).password
  return typeof candidate === 'string' ? candidate.trim() : ''
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const password = readPassword(body)

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(password, 10)

    await prisma.note.update({
      where: { id },
      data: {
        isLocked: true,
        lockHash: hash,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notes/[id]/lock error:', error)
    return NextResponse.json(
      { success: false, error: '잠금 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const password = readPassword(body)

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const note = await prisma.note.findUnique({
      where: { id },
      select: {
        lockHash: true,
      },
    })

    if (!note?.lockHash) {
      return NextResponse.json(
        { success: false, error: '잠긴 노트가 아닙니다.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, note.lockHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notes/[id]/lock error:', error)
    return NextResponse.json(
      { success: false, error: '잠금 해제 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const password = readPassword(body)

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const note = await prisma.note.findUnique({
      where: { id },
      select: {
        lockHash: true,
      },
    })

    if (!note?.lockHash) {
      return NextResponse.json(
        { success: false, error: '잠긴 노트가 아닙니다.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, note.lockHash)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      )
    }

    await prisma.note.update({
      where: { id },
      data: {
        isLocked: false,
        lockHash: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/notes/[id]/lock error:', error)
    return NextResponse.json(
      { success: false, error: '잠금 제거 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
