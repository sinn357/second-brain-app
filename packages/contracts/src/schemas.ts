import { z } from 'zod'

export const folderSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const tagSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
})

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  folderId: z.string().nullable(),
  isLocked: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  pinnedAt: z.coerce.date().nullable().default(null),
  lastOpenedAt: z.coerce.date().nullable().default(null),
  manualOrder: z.number().int().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  folder: folderSummarySchema.nullish(),
  tags: z
    .array(
      z.object({
        tag: tagSummarySchema,
      })
    )
    .optional(),
})

export const folderSchema: z.ZodType<{
  id: string
  name: string
  parentId: string | null
  position: number
  isDefault: boolean
  children?: unknown[]
  _count?: { notes: number }
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    position: z.number(),
    isDefault: z.boolean().default(false),
    children: z.array(folderSchema).optional(),
    _count: z
      .object({
        notes: z.number(),
      })
      .optional(),
  })
)

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  _count: z
    .object({
      notes: z.number(),
    })
    .optional(),
})

export const graphDataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      folderId: z.string().nullable(),
      folderName: z.string().nullable(),
      isMissing: z.boolean().optional(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
    })
  ),
  folders: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  latestUpdatedNoteId: z.string().nullable().optional(),
  unresolved: z.array(
    z.object({
      title: z.string(),
      sources: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
        })
      ),
    })
  ),
})

export const notesListResponseSchema = z.object({
  success: z.literal(true),
  notes: z.array(noteSchema),
  nextCursor: z.string().nullable().optional(),
  hasMore: z.boolean().optional(),
})

export const noteDetailResponseSchema = z.object({
  success: z.literal(true),
  note: noteSchema,
})

export const foldersListResponseSchema = z.object({
  success: z.literal(true),
  folders: z.array(folderSchema),
})

export const graphResponseSchema = z.object({
  success: z.literal(true),
  graph: graphDataSchema,
})

export const tagsResponseSchema = z.object({
  success: z.literal(true),
  tags: z.array(tagSchema),
})
