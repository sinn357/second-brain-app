import { redirect } from 'next/navigation'

interface NoteRedirectPageProps {
  params: Promise<{ id: string }>
}

export default async function NoteRedirectPage({ params }: NoteRedirectPageProps) {
  const { id } = await params
  redirect(`/notes?noteId=${id}`)
}
