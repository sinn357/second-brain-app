import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const monthTitle = format(targetDate, 'yyyy-MM')

    let monthlyFolder = await prisma.folder.findFirst({
      where: { name: 'Monthly Notes' },
    })

    if (!monthlyFolder) {
      monthlyFolder = await prisma.folder.create({
        data: {
          name: 'Monthly Notes',
          position: 2,
        },
      })
    }

    let monthlyNote = await prisma.note.findFirst({
      where: {
        title: monthTitle,
        folderId: monthlyFolder.id,
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

    if (!monthlyNote) {
      const monthlyTemplate = await prisma.template.findFirst({
        where: { name: 'Monthly Note' },
      })

      let content = `# ${monthTitle}\n\n## Goals\n\n- [ ] \n\n## Review\n\n`

      if (monthlyTemplate) {
        content = monthlyTemplate.content.replace(/\{\{month\}\}/g, monthTitle)
      }

      monthlyNote = await prisma.note.create({
        data: {
          title: monthTitle,
          body: content,
          folderId: monthlyFolder.id,
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

    return NextResponse.json({ success: true, note: monthlyNote })
  } catch (error) {
    console.error('GET /api/monthly-notes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
