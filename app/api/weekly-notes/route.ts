import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { endOfWeek, format, startOfWeek } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()

    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })
    const weekTitle = `${format(weekStart, 'yyyy-MM-dd')} ~ ${format(weekEnd, 'MM-dd')}`

    let weeklyFolder = await prisma.folder.findFirst({
      where: { name: 'Weekly Notes' },
    })

    if (!weeklyFolder) {
      weeklyFolder = await prisma.folder.create({
        data: {
          name: 'Weekly Notes',
          position: 1,
        },
      })
    }

    let weeklyNote = await prisma.note.findFirst({
      where: {
        title: weekTitle,
        folderId: weeklyFolder.id,
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

    if (!weeklyNote) {
      const weeklyTemplate = await prisma.template.findFirst({
        where: { name: 'Weekly Note' },
      })

      let content = `# ${weekTitle}\n\n## Goals\n\n- [ ] \n\n## Review\n\n`

      if (weeklyTemplate) {
        content = weeklyTemplate.content
          .replace(/\{\{week_start\}\}/g, format(weekStart, 'yyyy-MM-dd'))
          .replace(/\{\{week_end\}\}/g, format(weekEnd, 'yyyy-MM-dd'))
      }

      weeklyNote = await prisma.note.create({
        data: {
          title: weekTitle,
          body: content,
          folderId: weeklyFolder.id,
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

    return NextResponse.json({ success: true, note: weeklyNote })
  } catch (error) {
    console.error('GET /api/weekly-notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
