import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'

// POST /api/attachments/upload - 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const noteId = formData.get('noteId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Cloudinary에 업로드
    const { url, publicId, thumbnailUrl } = await uploadToCloudinary(buffer, file.name)

    // DB에 저장
    const attachment = await prisma.attachment.create({
      data: {
        noteId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        cloudinaryId: publicId,
        url,
        thumbnailUrl,
      },
    })

    return NextResponse.json({ success: true, attachment })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// GET /api/attachments/upload?noteId=xxx - 노트의 첨부파일 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const attachments = await prisma.attachment.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, attachments })
  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json({ error: 'Failed to get attachments' }, { status: 500 })
  }
}
