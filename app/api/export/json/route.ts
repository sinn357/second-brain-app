import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/export/json - 모든 데이터를 JSON으로 Export
export async function GET() {
  try {
    // 모든 데이터 조회
    const [notes, folders, tags, noteTags, links, properties, noteProperties, templates] = await Promise.all([
      prisma.note.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.folder.findMany({
        orderBy: { position: 'asc' },
      }),
      prisma.tag.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.noteTag.findMany(),
      prisma.link.findMany(),
      prisma.property.findMany(),
      prisma.noteProperty.findMany(),
      prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Export 데이터 구조
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        notes,
        folders,
        tags,
        noteTags,
        links,
        properties,
        noteProperties,
        templates,
      },
      stats: {
        totalNotes: notes.length,
        totalFolders: folders.length,
        totalTags: tags.length,
        totalLinks: links.length,
        totalProperties: properties.length,
        totalTemplates: templates.length,
      },
    }

    // JSON 응답
    const jsonString = JSON.stringify(exportData, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `second-brain-${timestamp}.json`

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/export/json error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export JSON' },
      { status: 500 }
    )
  }
}
