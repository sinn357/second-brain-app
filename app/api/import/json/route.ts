import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/import/json - JSON 데이터 Import
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string // 'replace' or 'merge'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // JSON 파일 읽기
    const content = await file.text()
    const importData = JSON.parse(content)

    // 버전 확인
    if (importData.version !== '1.0.0') {
      return NextResponse.json(
        { success: false, error: 'Unsupported export version' },
        { status: 400 }
      )
    }

    const { data } = importData

    // Replace 모드: 기존 데이터 삭제
    if (mode === 'replace') {
      await prisma.$transaction([
        prisma.noteProperty.deleteMany(),
        prisma.noteTag.deleteMany(),
        prisma.link.deleteMany(),
        prisma.note.deleteMany(),
        prisma.folder.deleteMany(),
        prisma.tag.deleteMany(),
        prisma.property.deleteMany(),
        prisma.template.deleteMany(),
      ])
    }

    // 데이터 Import (순서 중요: 의존성 고려)
    const stats = {
      folders: 0,
      tags: 0,
      properties: 0,
      templates: 0,
      notes: 0,
      noteTags: 0,
      links: 0,
      noteProperties: 0,
    }

    // 1. Folders
    if (data.folders && data.folders.length > 0) {
      for (const folder of data.folders) {
        await prisma.folder.create({
          data: {
            id: folder.id,
            name: folder.name,
            parentId: folder.parentId,
            position: folder.position,
          },
        })
        stats.folders++
      }
    }

    // 2. Tags
    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        await prisma.tag.create({
          data: {
            id: tag.id,
            name: tag.name,
            color: tag.color,
          },
        })
        stats.tags++
      }
    }

    // 3. Properties
    if (data.properties && data.properties.length > 0) {
      for (const property of data.properties) {
        await prisma.property.create({
          data: {
            id: property.id,
            name: property.name,
            type: property.type,
            options: property.options,
          },
        })
        stats.properties++
      }
    }

    // 4. Templates
    if (data.templates && data.templates.length > 0) {
      for (const template of data.templates) {
        await prisma.template.create({
          data: {
            id: template.id,
            name: template.name,
            content: template.content,
            description: template.description,
            isDefault: template.isDefault,
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt),
          },
        })
        stats.templates++
      }
    }

    // 5. Notes
    if (data.notes && data.notes.length > 0) {
      for (const note of data.notes) {
        await prisma.note.create({
          data: {
            id: note.id,
            title: note.title,
            body: note.body,
            folderId: note.folderId,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          },
        })
        stats.notes++
      }
    }

    // 6. NoteTags
    if (data.noteTags && data.noteTags.length > 0) {
      for (const noteTag of data.noteTags) {
        await prisma.noteTag.create({
          data: {
            noteId: noteTag.noteId,
            tagId: noteTag.tagId,
          },
        })
        stats.noteTags++
      }
    }

    // 7. Links
    if (data.links && data.links.length > 0) {
      for (const link of data.links) {
        await prisma.link.create({
          data: {
            id: link.id,
            sourceId: link.sourceId,
            targetId: link.targetId,
          },
        })
        stats.links++
      }
    }

    // 8. NoteProperties
    if (data.noteProperties && data.noteProperties.length > 0) {
      for (const noteProp of data.noteProperties) {
        await prisma.noteProperty.create({
          data: {
            id: noteProp.id,
            noteId: noteProp.noteId,
            propertyId: noteProp.propertyId,
            value: noteProp.value,
          },
        })
        stats.noteProperties++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed (${mode} mode)`,
      stats,
    })
  } catch (error) {
    console.error('POST /api/import/json error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import JSON data' },
      { status: 500 }
    )
  }
}
