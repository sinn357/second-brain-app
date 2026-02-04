import { prisma } from '@/lib/db'

const MAX_VERSIONS_PER_NOTE = 50

/**
 * 노트 버전 생성
 * - 새 버전 번호 자동 할당
 * - 최대 50개 버전 유지 (초과 시 오래된 버전 삭제)
 */
export async function createNoteVersion(
  noteId: string,
  title: string,
  body: string
): Promise<void> {
  // 마지막 버전 번호 조회
  const lastVersion = await prisma.noteVersion.findFirst({
    where: { noteId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })

  const newVersionNumber = (lastVersion?.version ?? 0) + 1

  // 새 버전 생성
  await prisma.noteVersion.create({
    data: {
      noteId,
      version: newVersionNumber,
      title,
      body,
    },
  })

  // 오래된 버전 정리 (최대 50개 유지)
  const versionsToDelete = await prisma.noteVersion.findMany({
    where: { noteId },
    orderBy: { version: 'desc' },
    skip: MAX_VERSIONS_PER_NOTE,
    select: { id: true },
  })

  if (versionsToDelete.length > 0) {
    await prisma.noteVersion.deleteMany({
      where: {
        id: { in: versionsToDelete.map((v) => v.id) },
      },
    })
  }
}

/**
 * 노트 버전 수 조회
 */
export async function getNoteVersionCount(noteId: string): Promise<number> {
  return prisma.noteVersion.count({
    where: { noteId },
  })
}
