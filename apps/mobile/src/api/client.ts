import { parseApiJson } from '@nexus/contracts/api'
import { noteDetailResponseSchema, notesListResponseSchema } from '@nexus/contracts/schemas'
import type { Note } from '@nexus/contracts/entities'

const DEFAULT_API_BASE_URL = 'http://localhost:3004'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL

let notesCache: Note[] = []
const noteCacheById = new Map<string, Note>()

export async function fetchNotes(): Promise<Note[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes`)
    const data = await parseApiJson(response, notesListResponseSchema)
    notesCache = data.notes
    data.notes.forEach((note) => noteCacheById.set(note.id, note))
    return data.notes
  } catch (error) {
    if (notesCache.length > 0) return notesCache
    throw error
  }
}

export async function fetchNote(id: string): Promise<Note> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${id}`)
    const data = await parseApiJson(response, noteDetailResponseSchema)
    noteCacheById.set(id, data.note)
    return data.note
  } catch (error) {
    const cached = noteCacheById.get(id)
    if (cached) return cached
    throw error
  }
}

export async function createNote(input: {
  title: string
  body: string
  folderId?: string | null
}): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseApiJson(response, noteDetailResponseSchema)
  noteCacheById.set(data.note.id, data.note)
  notesCache = [data.note, ...notesCache]
  return data.note
}

export async function updateNote(
  id: string,
  input: {
    title?: string
    body?: string
    folderId?: string | null
    isPinned?: boolean
  }
): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await parseApiJson(response, noteDetailResponseSchema)
  noteCacheById.set(id, data.note)
  notesCache = notesCache.map((note) => (note.id === id ? data.note : note))
  return data.note
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/notes/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`삭제에 실패했습니다. (HTTP ${response.status})`)
  }
  noteCacheById.delete(id)
  notesCache = notesCache.filter((note) => note.id !== id)
}
