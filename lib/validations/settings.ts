import { z } from 'zod'

export const notesSortSchema = z.object({
  sortBy: z.enum(['title', 'updated', 'opened', 'created', 'manual']),
  order: z.enum(['asc', 'desc']),
})

export type NotesSortSetting = z.infer<typeof notesSortSchema>
