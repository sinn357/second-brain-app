import { NextRequest, NextResponse } from 'next/server'
import { executeCombine } from '@/lib/thinking/commands'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, recentNoteIds } = body

    if (!noteId) {
      return NextResponse.json({ error: 'noteId가 필요합니다' }, { status: 400 })
    }

    const result = await executeCombine(noteId, recentNoteIds || [])

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Combine error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
