import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import JSZip from 'jszip'

// POST /api/import/obsidian - Obsidian Vault (Markdown ZIP) Import
export async function POST(request: Request) {
  try {
    const formData = (await request.formData()) as unknown as {
      get: (name: string) => FormDataEntryValue | null
    }
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // ZIP 파일 읽기
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // 폴더 매핑 (path -> folderId)
    const folderMap = new Map<string, string>()

    // 폴더 생성 함수
    const getOrCreateFolder = async (path: string): Promise<string | null> => {
      if (!path) return null
      if (folderMap.has(path)) {
        return folderMap.get(path)!
      }

      const parts = path.split('/')
      let currentParentId: string | null = null

      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join('/')
        const folderName = parts[i]

        if (folderMap.has(currentPath)) {
          currentParentId = folderMap.get(currentPath)!
          continue
        }

        // 폴더 생성
        const createdFolderResult = await prisma.folder.create({
          data: {
            name: folderName,
            parentId: currentParentId,
            position: i,
          },
        })
        const folderId: string = createdFolderResult.id

        folderMap.set(currentPath, folderId)
        currentParentId = folderId
      }

      return currentParentId
    }

    // 마크다운 파일 파싱
    const files = Object.keys(zip.files).filter(
      (filename) => filename.endsWith('.md') && !filename.startsWith('__MACOSX')
    )

    let importedCount = 0
    const errors: string[] = []

    for (const filename of files) {
      try {
        const content = await zip.files[filename].async('string')

        // 파일 경로 파싱
        const pathParts = filename.split('/')
        const fileName = pathParts.pop()!
        const folderPath = pathParts.join('/')

        // 제목 추출 (파일명에서 .md 제거)
        const title = fileName.replace(/\.md$/, '')

        // Frontmatter 파싱 (간단한 구현)
        let body = content
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/)

        if (frontmatterMatch) {
          body = frontmatterMatch[2].trim()
        }

        // 첫 줄이 # 제목이면 제거 (title과 중복)
        body = body.replace(/^#\s+.*\n\n/, '')

        // 폴더 생성 또는 가져오기
        const folderId = await getOrCreateFolder(folderPath)

        // 노트 생성
        await prisma.note.create({
          data: {
            title,
            body,
            folderId,
          },
        })

        importedCount++
      } catch (err) {
        console.error(`Error importing ${filename}:`, err)
        errors.push(`${filename}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} notes`,
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('POST /api/import/obsidian error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import Obsidian vault' },
      { status: 500 }
    )
  }
}
