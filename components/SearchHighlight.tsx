'use client'

interface SearchHighlightProps {
  text: string
  query: string
  mode?: 'normal' | 'regex'
  className?: string
}

/**
 * 텍스트에서 검색어를 찾아 하이라이트 표시
 */
export function SearchHighlight({ text, query, mode = 'normal', className = '' }: SearchHighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  try {
    let parts: { text: string; highlight: boolean }[] = []

    if (mode === 'regex') {
      // 정규식 모드
      const regex = new RegExp(`(${query})`, 'gi')
      const splits = text.split(regex)

      parts = splits.map((part, i) => ({
        text: part,
        highlight: i % 2 === 1, // 정규식 매칭된 부분은 홀수 인덱스
      }))
    } else {
      // 일반 모드 (대소문자 무시)
      const lowerText = text.toLowerCase()
      const lowerQuery = query.toLowerCase()
      let lastIndex = 0
      let index = lowerText.indexOf(lowerQuery)

      while (index !== -1) {
        // 매칭 이전 텍스트
        if (index > lastIndex) {
          parts.push({
            text: text.substring(lastIndex, index),
            highlight: false,
          })
        }

        // 매칭된 텍스트
        parts.push({
          text: text.substring(index, index + query.length),
          highlight: true,
        })

        lastIndex = index + query.length
        index = lowerText.indexOf(lowerQuery, lastIndex)
      }

      // 남은 텍스트
      if (lastIndex < text.length) {
        parts.push({
          text: text.substring(lastIndex),
          highlight: false,
        })
      }
    }

    return (
      <span className={className}>
        {parts.map((part, i) =>
          part.highlight ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-900 text-inherit font-semibold rounded px-0.5"
            >
              {part.text}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </span>
    )
  } catch (error) {
    // 정규식 에러 시 원본 텍스트 반환
    return <span className={className}>{text}</span>
  }
}
