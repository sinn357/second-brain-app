import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesSortSchema, type NotesSortSetting } from '@/lib/validations/settings'

const DEFAULT_SETTING: NotesSortSetting = { sortBy: 'title', order: 'asc' }

export function useNotesSortSetting() {
  return useQuery<NotesSortSetting, Error>({
    queryKey: ['settings', 'notes-sort'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notes-sort')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to load setting')
      const parsed = notesSortSchema.safeParse(data.setting)
      return parsed.success ? parsed.data : DEFAULT_SETTING
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateNotesSortSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (setting: NotesSortSetting) => {
      const response = await fetch('/api/settings/notes-sort', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to update setting')
      return setting
    },
    onSuccess: (setting) => {
      queryClient.setQueryData(['settings', 'notes-sort'], setting)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', 'infinite'] })
    },
  })
}
