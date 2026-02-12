import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { notesSortSchema } from '@/lib/validations/settings'

const SETTINGS_KEY = 'notes_sort'
const DEFAULT_SETTING = { sortBy: 'title', order: 'asc' } as const

// GET /api/settings/notes-sort
export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SETTINGS_KEY },
    })

    const value = setting?.value ?? DEFAULT_SETTING
    const parsed = notesSortSchema.safeParse(value)

    return NextResponse.json({
      success: true,
      setting: parsed.success ? parsed.data : DEFAULT_SETTING,
    })
  } catch (error) {
    console.error('GET /api/settings/notes-sort error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/notes-sort
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validated = notesSortSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validated.error.format(),
        },
        { status: 400 }
      )
    }

    const setting = await prisma.appSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: validated.data },
      create: { key: SETTINGS_KEY, value: validated.data },
    })

    return NextResponse.json({ success: true, setting: setting.value })
  } catch (error) {
    console.error('PUT /api/settings/notes-sort error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
