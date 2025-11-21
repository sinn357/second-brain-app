import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'

interface Params {
  params: Promise<{ id: string }>
}

// DELETE /api/attachments/[id] - 첨부파일 삭제
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // DB에서 첨부파일 정보 가져오기
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Cloudinary에서 삭제
    await deleteFromCloudinary(attachment.cloudinaryId)

    // DB에서 삭제
    await prisma.attachment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete attachment error:', error)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }
}
