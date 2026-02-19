import { NextResponse } from 'next/server'

interface OgResponse {
  title: string
  description: string
  image: string
  siteName: string
  url: string
}

function getMeta(html: string, keys: string[]): string {
  for (const key of keys) {
    const regex = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    )
    const match = html.match(regex)
    if (match?.[1]) return match[1]
  }
  return ''
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const target = searchParams.get('url')
    if (!target) {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(target)
    } catch {
      return NextResponse.json({ success: false, error: 'invalid url' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ success: false, error: 'invalid protocol' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecondBrainBot/1.0)',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'failed to fetch url' }, { status: 400 })
    }

    const html = await response.text()
    const title = getMeta(html, ['og:title']) || (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '')
    const description = getMeta(html, ['og:description', 'description'])
    const image = getMeta(html, ['og:image'])
    const siteName = getMeta(html, ['og:site_name']) || parsedUrl.hostname

    const data: OgResponse = {
      title: title || parsedUrl.hostname,
      description,
      image,
      siteName,
      url: parsedUrl.toString(),
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/og error:', error)
    return NextResponse.json(
      { success: false, error: 'failed to load open graph' },
      { status: 500 }
    )
  }
}
