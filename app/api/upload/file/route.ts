import { NextResponse } from 'next/server'
import { uploadFile } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name)

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      filename: file.name,
      bytes: result.bytes,
    })
  } catch (error) {
    console.error('POST /api/upload/file error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
