import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function Home() {
  const latestNote = await prisma.note.findFirst({
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      folderId: true,
    },
  })

  if (!latestNote) {
    redirect('/notes')
  }

  const params = new URLSearchParams({ noteId: latestNote.id })
  if (latestNote.folderId) {
    params.set('folderId', latestNote.folderId)
  }

  redirect(`/notes?${params.toString()}`)
}
