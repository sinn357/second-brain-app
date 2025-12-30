import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import JSZip from 'jszip'

// GET /api/export/markdown - 모든 노트를 Markdown ZIP으로 Export
export async function GET() {
  try {
    // 모든 노트 조회 (폴더, 태그 포함)
    const notes = await prisma.note.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    // 모든 폴더 조회 (계층 구조)
    const folders = await prisma.folder.findMany({
      orderBy: { position: 'asc' },
    })

    // ZIP 생성
    const zip = new JSZip()

    // 폴더 경로 매핑 (id -> path)
    const folderPaths = new Map<string, string>()

    // 루트 폴더부터 경로 생성
    const buildFolderPath = (folderId: string): string => {
      if (folderPaths.has(folderId)) {
        return folderPaths.get(folderId)!
      }

      const folder = folders.find((f) => f.id === folderId)
      if (!folder) return ''

      let path = folder.name
      if (folder.parentId) {
        const parentPath = buildFolderPath(folder.parentId)
        path = parentPath ? `${parentPath}/${folder.name}` : folder.name
      }

      folderPaths.set(folderId, path)
      return path
    }

    // 각 노트를 Markdown 파일로 변환
    for (const note of notes) {
      let content = `# ${note.title}\n\n`

      // 메타데이터 추가
      content += `---\n`
      content += `created: ${note.createdAt.toISOString()}\n`
      content += `updated: ${note.updatedAt.toISOString()}\n`

      // 태그 추가
      if (note.tags.length > 0) {
        const tagNames = note.tags.map((nt) => nt.tag.name).join(', ')
        content += `tags: ${tagNames}\n`
      }

      // 속성 추가
      if (note.properties.length > 0) {
        for (const prop of note.properties) {
          content += `${prop.property.name}: ${JSON.stringify(prop.value)}\n`
        }
      }

      content += `---\n\n`

      // 본문 추가
      content += note.body

      // 파일 경로 결정 (폴더 구조 유지)
      let filePath = ''
      if (note.folderId) {
        const folderPath = buildFolderPath(note.folderId)
        filePath = folderPath ? `${folderPath}/` : ''
      }

      // 파일명 생성 (제목에서 특수문자 제거)
      const safeTitle = note.title
        .replace(/[\/\\:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()

      const fileName = `${safeTitle}.md`
      zip.file(`${filePath}${fileName}`, content)
    }

    // README 파일 추가
    const readme = `# Second Brain Export\n\n`
      + `Exported at: ${new Date().toISOString()}\n\n`
      + `Total notes: ${notes.length}\n`
      + `Total folders: ${folders.length}\n`

    zip.file('README.md', readme)

    // ZIP 생성
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' })

    // 파일명 생성 (날짜 포함)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `second-brain-${timestamp}.zip`

    // 응답 반환
    return new Response(zipBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/export/markdown error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export markdown' },
      { status: 500 }
    )
  }
}
