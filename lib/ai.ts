import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AI를 사용한 태그 생성
export async function generateTags(content: string): Promise<string[]> {
  try {
    // 내용이 너무 짧으면 태그 생성하지 않음
    if (content.length < 50) {
      return []
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 노트 내용을 분석하여 관련 태그를 생성하는 AI입니다.
규칙:
- 3-5개의 태그를 생성하세요
- 태그는 한글 또는 영어 단어로만 구성
- 각 태그는 2-15자 이내
- 태그는 쉼표로 구분
- 추가 설명 없이 태그만 출력
예시: 프로젝트, 업무, 아이디어, 개발, React`,
        },
        {
          role: 'user',
          content: `다음 노트 내용을 분석하여 적절한 태그를 생성해주세요:\n\n${content.slice(0, 1000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    })

    const tagsText = response.choices[0]?.message?.content?.trim() || ''

    // 쉼표로 구분된 태그를 배열로 변환
    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= 15)
      .slice(0, 5)

    return tags
  } catch (error) {
    console.error('AI tag generation error:', error)
    throw new Error('태그 생성에 실패했습니다')
  }
}

// AI를 사용한 노트 요약
export async function generateSummary(content: string): Promise<string> {
  try {
    // 내용이 너무 짧으면 요약하지 않음
    if (content.length < 200) {
      return '요약하기엔 내용이 너무 짧습니다.'
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 노트 내용을 간결하게 요약하는 AI입니다.
규칙:
- 3-5줄로 핵심 내용만 요약
- 중요한 키워드는 유지
- 불필요한 수식어 제거
- 한글 또는 영어로 작성`,
        },
        {
          role: 'user',
          content: `다음 노트 내용을 요약해주세요:\n\n${content.slice(0, 2000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const summary = response.choices[0]?.message?.content?.trim() || ''

    if (!summary) {
      throw new Error('요약 생성 실패')
    }

    return summary
  } catch (error) {
    console.error('AI summary generation error:', error)
    throw new Error('요약 생성에 실패했습니다')
  }
}

// AI 제목 제안 (보너스 기능)
export async function suggestTitle(content: string): Promise<string> {
  try {
    if (content.length < 50) {
      return '제목 없음'
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 노트 내용을 분석하여 적절한 제목을 제안하는 AI입니다.
규칙:
- 5-20자 이내의 간결한 제목
- 내용의 핵심을 담은 제목
- 추가 설명 없이 제목만 출력`,
        },
        {
          role: 'user',
          content: `다음 노트 내용에 적절한 제목을 제안해주세요:\n\n${content.slice(0, 1000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
    })

    const title = response.choices[0]?.message?.content?.trim() || ''

    return title || '제목 없음'
  } catch (error) {
    console.error('AI title suggestion error:', error)
    throw new Error('제목 제안에 실패했습니다')
  }
}
