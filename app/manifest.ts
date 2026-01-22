import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexus - Second Brain',
    short_name: 'Nexus',
    description: '개인 지식 관리 앱 - 노트, 위키링크, 그래프 뷰',
    start_url: '/notes',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#4f46e5',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['productivity', 'utilities'],
    lang: 'ko-KR',
  }
}
