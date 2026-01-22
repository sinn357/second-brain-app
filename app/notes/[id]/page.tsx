import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default function NoteRedirectPage({ params }: Props) {
  redirect(`/notes?noteId=${params.id}`)
}
