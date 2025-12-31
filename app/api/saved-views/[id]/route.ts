import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/saved-views/[id]
 * 특정 저장된 뷰 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const savedView = await prisma.savedView.findUnique({
      where: { id },
    })

    if (!savedView) {
      return NextResponse.json(
        { success: false, error: '저장된 뷰를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      savedView,
    })
  } catch (error) {
    console.error('Get saved view error:', error)
    return NextResponse.json(
      { success: false, error: '저장된 뷰 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/saved-views/[id]
 * 저장된 뷰 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, filters } = body

    const savedView = await prisma.savedView.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters }),
      },
    })

    return NextResponse.json({
      success: true,
      savedView,
    })
  } catch (error) {
    console.error('Update saved view error:', error)
    return NextResponse.json(
      { success: false, error: '뷰 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/saved-views/[id]
 * 저장된 뷰 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.savedView.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete saved view error:', error)
    return NextResponse.json(
      { success: false, error: '뷰 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
