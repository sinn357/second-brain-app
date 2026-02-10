import { NextRequest, NextResponse } from 'next/server'
import { executeContrast } from '@/lib/thinking/commands'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, recentNoteIds } = body

    if (!noteId) {
      return NextResponse.json({ error: 'noteId가 필요합니다' }, { status: 400 })
    }

    const result = await executeContrast(noteId, recentNoteIds || [])

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Contrast error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
