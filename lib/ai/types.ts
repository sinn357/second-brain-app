export type AICommand =
  | 'summarize'
  | 'expand'
  | 'clarify'
  | 'structure'
  | 'tagSuggest'
  | 'question'
  | 'action'

export interface AIRequest {
  noteId: string
  command: AICommand
  content: string
  title: string
}

export interface AIResponse {
  command: AICommand
  result: string
  isDraft: true
  createdAt: string
}

export interface SummarizeResult {
  summary: string[]
  keywords: string[]
}

export interface ExpandResult {
  deepDive: string[]
  broaden: string[]
  connect: string[]
}

export interface ClarifyResult {
  ambiguous: Array<{
    quote: string
    question: string
  }>
  missing: string[]
  questions: string[]
}

export interface StructureResult {
  currentStructure: Array<{
    level: number
    content: string
  }>
  suggestedStructure: Array<{
    level: number
    content: string
  }>
  keyVariables: string[]
  redundancies: string[]
}

export interface TagSuggestResult {
  topicTags: string[]
  typeTags: string[]
  statusTags: string[]
}

export interface QuestionResult {
  unanswered: string[]
  deeper: string[]
  actionable: string[]
}

export interface ActionResult {
  explore: string[]
  research: string[]
  connect: string[]
}
