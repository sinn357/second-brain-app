import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

// GET /api/daily-notes?date=yyyy-MM-dd (없으면 오늘)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // 날짜 파라미터가 없으면 오늘 날짜 사용
    const targetDate = dateParam || format(new Date(), 'yyyy-MM-dd')

    // Daily Notes 폴더 확인 및 생성
    let dailyFolder = await prisma.folder.findFirst({
      where: { name: 'Daily Notes' },
    })

    if (!dailyFolder) {
      // Daily Notes 폴더 자동 생성
      dailyFolder = await prisma.folder.create({
        data: {
          name: 'Daily Notes',
          position: 0,
        },
      })
    }

    // 해당 날짜의 노트 찾기
    let dailyNote = await prisma.note.findFirst({
      where: {
        title: targetDate,
        folderId: dailyFolder.id,
      },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
        properties: {
          include: {
            property: true,
          },
        },
      },
    })

    // 노트가 없으면 자동 생성
    if (!dailyNote) {
      // Daily Note 템플릿 찾기
      const dailyTemplate = await prisma.template.findFirst({
        where: { name: 'Daily Note' },
      })

      let content = `# ${targetDate}\n\n## Tasks\n\n- [ ] \n\n## Notes\n\n`

      if (dailyTemplate) {
        // 템플릿 변수 치환
        content = dailyTemplate.content.replace(/\{\{date\}\}/g, targetDate)
      }

      dailyNote = await prisma.note.create({
        data: {
          title: targetDate,
          body: content,
          folderId: dailyFolder.id,
        },
        include: {
          folder: true,
          tags: {
            include: {
              tag: true,
            },
          },
          properties: {
            include: {
              property: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ success: true, note: dailyNote })
  } catch (error) {
    console.error('GET /api/daily-notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
