import { prisma } from '@/lib/db'

interface ContextNote {
  noteId: string
  title: string
  score: number
  reason: string
}

interface ContextStackInput {
  currentNoteId: string
  recentNoteIds?: string[]
  limit?: number
}

interface ContextStackResult {
  notes: ContextNote[]
  debug?: {
    linkNotes: number
    recentNotes: number
    tagNotes: number
  }
}

const WEIGHTS = {
  DIRECT_LINK: 50,
  SECOND_HOP: 25,
  RECENT_VIEW: 30,
  SAME_TAG: 20,
  SAME_FOLDER: 15,
  RECENCY: 10,
}

async function getLinkedNotes(noteId: string): Promise<Map<string, number>> {
  const links = await prisma.link.findMany({
    where: {
      OR: [{ sourceId: noteId }, { targetId: noteId }],
    },
    include: {
      source: { select: { id: true, title: true } },
      target: { select: { id: true, title: true } },
    },
  })

  const scoreMap = new Map<string, number>()

  links.forEach((link) => {
    const linkedId = link.sourceId === noteId ? link.targetId : link.sourceId
    if (linkedId !== noteId) {
      scoreMap.set(linkedId, WEIGHTS.DIRECT_LINK)
    }
  })

  return scoreMap
}

async function getSecondHopNotes(
  noteId: string,
  firstHopIds: string[]
): Promise<Map<string, number>> {
  if (firstHopIds.length === 0) return new Map()

  const links = await prisma.link.findMany({
    where: {
      OR: [{ sourceId: { in: firstHopIds } }, { targetId: { in: firstHopIds } }],
    },
  })

  const scoreMap = new Map<string, number>()

  links.forEach((link) => {
    const ids = [link.sourceId, link.targetId]
    ids.forEach((id) => {
      if (id !== noteId && !firstHopIds.includes(id)) {
        const current = scoreMap.get(id) || 0
        scoreMap.set(id, Math.max(current, WEIGHTS.SECOND_HOP))
      }
    })
  })

  return scoreMap
}

async function getSameTagNotes(noteId: string): Promise<Map<string, number>> {
  const currentTags = await prisma.noteTag.findMany({
    where: { noteId },
    select: { tagId: true },
  })

  if (currentTags.length === 0) return new Map()

  const tagIds = currentTags.map((t) => t.tagId)

  const relatedNoteTags = await prisma.noteTag.findMany({
    where: {
      tagId: { in: tagIds },
      noteId: { not: noteId },
    },
    select: { noteId: true },
  })

  const scoreMap = new Map<string, number>()
  relatedNoteTags.forEach((nt) => {
    const current = scoreMap.get(nt.noteId) || 0
    scoreMap.set(nt.noteId, current + WEIGHTS.SAME_TAG)
  })

  return scoreMap
}

async function getSameFolderNotes(noteId: string): Promise<Map<string, number>> {
  const currentNote = await prisma.note.findUnique({
    where: { id: noteId },
    select: { folderId: true },
  })

  if (!currentNote?.folderId) return new Map()

  const folderNotes = await prisma.note.findMany({
    where: {
      folderId: currentNote.folderId,
      id: { not: noteId },
    },
    select: { id: true },
  })

  const scoreMap = new Map<string, number>()
  folderNotes.forEach((n) => {
    scoreMap.set(n.id, WEIGHTS.SAME_FOLDER)
  })

  return scoreMap
}

function getRecentViewScores(
  recentNoteIds: string[],
  excludeId: string
): Map<string, number> {
  const scoreMap = new Map<string, number>()

  recentNoteIds.forEach((id, index) => {
    if (id !== excludeId) {
      const recencyBonus = WEIGHTS.RECENT_VIEW * (1 - index * 0.1)
      scoreMap.set(id, Math.max(recencyBonus, WEIGHTS.RECENT_VIEW * 0.5))
    }
  })

  return scoreMap
}

async function getRecencyScores(noteIds: string[]): Promise<Map<string, number>> {
  if (noteIds.length === 0) return new Map()

  const notes = await prisma.note.findMany({
    where: { id: { in: noteIds } },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const scoreMap = new Map<string, number>()
  const now = Date.now()

  notes.forEach((note) => {
    const ageMs = now - new Date(note.updatedAt).getTime()
    const dayAge = ageMs / (1000 * 60 * 60 * 24)

    if (dayAge <= 7) {
      const recencyScore = WEIGHTS.RECENCY * (1 - dayAge / 7)
      scoreMap.set(note.id, recencyScore)
    }
  })

  return scoreMap
}

function mergeScoreMaps(...maps: Map<string, number>[]): Map<string, number> {
  const merged = new Map<string, number>()

  maps.forEach((map) => {
    map.forEach((score, noteId) => {
      const current = merged.get(noteId) || 0
      merged.set(noteId, current + score)
    })
  })

  return merged
}

function generateReason(
  noteId: string,
  scores: {
    link: Map<string, number>
    secondHop: Map<string, number>
    tag: Map<string, number>
    folder: Map<string, number>
    recent: Map<string, number>
  }
): string {
  const reasons: string[] = []

  if (scores.link.has(noteId)) {
    reasons.push('직접 연결된 노트')
  }
  if (scores.secondHop.has(noteId)) {
    reasons.push('연결된 노트와 관련')
  }
  if (scores.tag.has(noteId)) {
    reasons.push('같은 태그 공유')
  }
  if (scores.folder.has(noteId)) {
    reasons.push('같은 폴더')
  }
  if (scores.recent.has(noteId)) {
    reasons.push('최근 수정됨')
  }

  return reasons.length > 0 ? reasons.join(', ') : '관련 노트'
}

export async function getContextualNotes(
  input: ContextStackInput
): Promise<ContextStackResult> {
  const { currentNoteId, recentNoteIds = [], limit = 5 } = input

  const linkScores = await getLinkedNotes(currentNoteId)
  const firstHopIds = Array.from(linkScores.keys())

  const secondHopScores = await getSecondHopNotes(currentNoteId, firstHopIds)
  const tagScores = await getSameTagNotes(currentNoteId)
  const folderScores = await getSameFolderNotes(currentNoteId)
  const recentViewScores = getRecentViewScores(recentNoteIds, currentNoteId)

  const mergedScores = mergeScoreMaps(
    linkScores,
    secondHopScores,
    tagScores,
    folderScores,
    recentViewScores
  )

  const allNoteIds = Array.from(mergedScores.keys())
  const recencyScores = await getRecencyScores(allNoteIds)

  recencyScores.forEach((score, noteId) => {
    const current = mergedScores.get(noteId) || 0
    mergedScores.set(noteId, current + score)
  })

  const sortedEntries = Array.from(mergedScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  const topNoteIds = sortedEntries.map(([id]) => id)
  const notes = await prisma.note.findMany({
    where: { id: { in: topNoteIds } },
    select: { id: true, title: true },
  })

  const noteMap = new Map(notes.map((n) => [n.id, n]))

  const scores = {
    link: linkScores,
    secondHop: secondHopScores,
    tag: tagScores,
    folder: folderScores,
    recent: recencyScores,
  }

  const result: ContextNote[] = sortedEntries.map(([noteId, score]) => ({
    noteId,
    title: noteMap.get(noteId)?.title || 'Unknown',
    score,
    reason: generateReason(noteId, scores),
  }))

  return {
    notes: result,
    debug: {
      linkNotes: linkScores.size,
      recentNotes: recentViewScores.size,
      tagNotes: tagScores.size,
    },
  }
}
