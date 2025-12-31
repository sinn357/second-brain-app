import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/saved-views
 * 모든 저장된 뷰 조회
 */
export async function GET() {
  try {
    const savedViews = await prisma.savedView.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      savedViews,
    })
  } catch (error) {
    console.error('Get saved views error:', error)
    return NextResponse.json(
      { success: false, error: '저장된 뷰 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/saved-views
 * 새 뷰 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, filters } = body

    // 필수 필드 검증
    if (!name || !filters) {
      return NextResponse.json(
        { success: false, error: '이름과 필터는 필수입니다' },
        { status: 400 }
      )
    }

    const savedView = await prisma.savedView.create({
      data: {
        name,
        description: description || null,
        filters,
      },
    })

    return NextResponse.json({
      success: true,
      savedView,
    })
  } catch (error) {
    console.error('Create saved view error:', error)
    return NextResponse.json(
      { success: false, error: '뷰 저장 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
