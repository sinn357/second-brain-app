import { openai } from '@/lib/openai'
import { SYSTEM_PROMPT, PROMPTS } from './prompts'
import type { AICommand, AIRequest, AIResponse } from './types'

const MAX_CONTENT_CHARS = 3000

export async function executeAICommand(request: AIRequest): Promise<AIResponse> {
  const { command, content, title } = request

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다')
  }

  const promptTemplate = PROMPTS[command]
  if (!promptTemplate) {
    throw new Error(`Unknown command: ${command}`)
  }

  const prompt = promptTemplate
    .replace('{{title}}', title)
    .replace('{{content}}', content.slice(0, MAX_CONTENT_CHARS))

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const resultJson = response.choices[0]?.message?.content
    if (!resultJson) {
      throw new Error('AI 응답 없음')
    }

    const parsed = safeParseJson(resultJson)
    if (!parsed) {
      throw new Error('AI 응답 파싱 실패')
    }

    const markdown = formatResultToMarkdown(command, parsed)

    return {
      command,
      result: markdown,
      isDraft: true,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`AI ${command} error:`, error)
    throw error
  }
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}

function ensureArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
}

function formatResultToMarkdown(command: AICommand, data: any): string {
  switch (command) {
    case 'summarize': {
      const summary = ensureArray(data.summary)
      const keywords = ensureArray(data.keywords)
      return `## 핵심 요약\n${summary.map((s) => `- ${s}`).join('\n')}\n\n## 키워드\n${keywords
        .map((k) => `#${String(k).replace('#', '')}`)
        .join(' ')}`
    }

    case 'expand': {
      const deepDive = ensureArray(data.deepDive)
      const broaden = ensureArray(data.broaden)
      const connect = ensureArray(data.connect)
      return `## 확장 가능한 방향\n\n### 깊이 파기\n${deepDive
        .map((q) => `- ${q}`)
        .join('\n')}\n\n### 넓히기\n${broaden
        .map((q) => `- ${q}`)
        .join('\n')}\n\n### 연결하기\n${connect.map((q) => `- ${q}`).join('\n')}`
    }

    case 'clarify': {
      const ambiguous = Array.isArray(data.ambiguous) ? data.ambiguous : []
      const missing = ensureArray(data.missing)
      const questions = ensureArray(data.questions)
      let clarifyMd = '## 명확화 필요 지점\n\n### 모호한 부분\n'
      clarifyMd += ambiguous
        .map((a: any) => `- "${String(a.quote ?? '')}" — ${String(a.question ?? '')}`)
        .join('\n')
      clarifyMd += '\n\n### 빠진 것 같은 부분\n'
      clarifyMd += missing.map((m) => `- ${m}`).join('\n')
      clarifyMd += '\n\n### 명확화 질문\n'
      clarifyMd += questions.map((q) => `- ${q}`).join('\n')
      return clarifyMd
    }

    case 'structure': {
      const currentStructure = Array.isArray(data.currentStructure) ? data.currentStructure : []
      const suggestedStructure = Array.isArray(data.suggestedStructure)
        ? data.suggestedStructure
        : []
      const keyVariables = ensureArray(data.keyVariables)
      const redundancies = ensureArray(data.redundancies)
      let structMd = '## 구조 제안\n\n### 현재 구조\n'
      structMd += currentStructure
        .map((s: any) => `${'  '.repeat(Math.max(0, Number(s.level || 1) - 1))}${s.level}. ${s.content}`)
        .join('\n')
      structMd += '\n\n### 제안 구조\n'
      structMd += suggestedStructure
        .map((s: any) => `${'  '.repeat(Math.max(0, Number(s.level || 1) - 1))}${s.level}. ${s.content}`)
        .join('\n')
      structMd += '\n\n### 핵심 변수\n'
      structMd += keyVariables.map((v) => `- ${v}`).join('\n')
      if (redundancies.length > 0) {
        structMd += '\n\n### 중복/제거 가능\n'
        structMd += redundancies.map((r) => `- ${r}`).join('\n')
      }
      return structMd
    }

    case 'tagSuggest': {
      const topicTags = ensureArray(data.topicTags)
      const typeTags = ensureArray(data.typeTags)
      const statusTags = ensureArray(data.statusTags)
      return `## 태그 제안\n\n### 주제 태그\n${topicTags.join(' ')}\n\n### 유형 태그\n${typeTags.join(' ')}\n\n### 상태 태그\n${statusTags.join(' ')}`
    }

    case 'question': {
      const unanswered = ensureArray(data.unanswered)
      const deeper = ensureArray(data.deeper)
      const actionable = ensureArray(data.actionable)
      return `## 이 노트가 던지는 질문\n\n### 아직 답하지 않은 질문\n${unanswered
        .map((q) => `- ${q}`)
        .join('\n')}\n\n### 더 깊이 파고들 질문\n${deeper
        .map((q) => `- ${q}`)
        .join('\n')}\n\n### 실행 관련 질문\n${actionable.map((q) => `- ${q}`).join('\n')}`
    }

    case 'action': {
      const explore = ensureArray(data.explore)
      const research = ensureArray(data.research)
      const connect = ensureArray(data.connect)
      return `## 고려할 수 있는 다음 단계\n\n### 탐구 방향\n${explore
        .map((a) => `- [ ] ${a}`)
        .join('\n')}\n\n### 추가 조사 고려\n${research
        .map((a) => `- [ ] ${a}`)
        .join('\n')}\n\n### 연결 가능한 노트/자료\n${connect
        .map((a) => `- ${a}`)
        .join('\n')}\n\n※ 이것은 제안일 뿐, 선택은 사용자의 몫`
    }

    default:
      return JSON.stringify(data, null, 2)
  }
}
