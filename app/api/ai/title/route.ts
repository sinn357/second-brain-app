import { NextRequest, NextResponse } from 'next/server'
import { suggestTitle } from '@/lib/ai'
import { z } from 'zod'

// 요청 스키마
const requestSchema = z.object({
  content: z.string().min(1),
})

// POST /api/ai/title - AI로 제목 제안
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = requestSchema.parse(body)

    // API 키 확인
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file.' },
        { status: 503 }
      )
    }

    // AI로 제목 제안
    const title = await suggestTitle(data.content)

    return NextResponse.json({ success: true, title })
  } catch (error) {
    console.error('POST /api/ai/title error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest title' },
      { status: 500 }
    )
  }
}
