import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeAICommand } from '@/lib/ai/service'
import type { AICommand } from '@/lib/ai/types'

const VALID_COMMANDS: AICommand[] = [
  'summarize',
  'expand',
  'clarify',
  'structure',
  'tagSuggest',
  'question',
  'action',
]

export async function POST(request: NextRequest) {
  try {
    let body: { noteId?: string; command?: AICommand } | null = null
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'JSON 요청 본문이 필요합니다' }, { status: 400 })
    }

    const { noteId, command } = body ?? {}

    if (!noteId) {
      return NextResponse.json({ error: 'noteId가 필요합니다' }, { status: 400 })
    }

    if (!command || !VALID_COMMANDS.includes(command)) {
      return NextResponse.json(
        { error: `유효하지 않은 command입니다. 가능한 값: ${VALID_COMMANDS.join(', ')}` },
        { status: 400 }
      )
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, title: true, body: true },
    })

    if (!note) {
      return NextResponse.json({ error: '노트를 찾을 수 없습니다' }, { status: 404 })
    }

    const result = await executeAICommand({
      noteId: note.id,
      command,
      content: note.body || '',
      title: note.title,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('AI note command error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
