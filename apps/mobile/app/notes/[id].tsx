import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useDeleteNote, useNote, useUpdateNote } from '@/src/features/notes/use-notes'
import type { Note } from '@nexus/contracts/entities'

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: note, isLoading, error } = useNote(id ?? '')
  const updateMutation = useUpdateNote(id ?? '')
  const deleteMutation = useDeleteNote()

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '노트 상세' }} />
      {isLoading && <ActivityIndicator size="large" color="#818cf8" />}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {!isLoading && !error && (
        note ? (
          <NoteEditorForm
            key={note.id}
            note={note}
            onSave={async ({ title, body }) => {
              if (!id) return
              await updateMutation.mutateAsync({ title, body })
            }}
            onDelete={async () => {
              if (!id) return
              await deleteMutation.mutateAsync(id)
              router.replace('/')
            }}
          />
        ) : null
      )}
    </SafeAreaView>
  )
}

function NoteEditorForm({
  note,
  onSave,
  onDelete,
}: {
  note: Note
  onSave: (input: { title: string; body: string }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)

  const handleSave = async () => {
    try {
      await onSave({ title, body })
      Alert.alert('저장 완료', '노트가 저장되었습니다.')
    } catch (saveError) {
      Alert.alert('저장 실패', saveError instanceof Error ? saveError.message : '알 수 없는 오류')
    }
  }

  const handleDelete = () => {
    Alert.alert('노트 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete()
          } catch (deleteError) {
            Alert.alert(
              '삭제 실패',
              deleteError instanceof Error ? deleteError.message : '알 수 없는 오류'
            )
          }
        },
      },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>제목</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.titleInput}
        placeholder="제목"
        placeholderTextColor="#64748b"
      />
      <Text style={styles.label}>본문</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        style={styles.bodyInput}
        placeholder="내용"
        placeholderTextColor="#64748b"
        textAlignVertical="top"
      />
      <View style={styles.actions}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>저장</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>삭제</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    backgroundColor: '#111827',
    color: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyInput: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    backgroundColor: '#111827',
    color: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveText: {
    color: '#eef2ff',
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteText: {
    color: '#fca5a5',
    fontWeight: '700',
  },
  error: {
    color: '#fda4af',
    padding: 16,
  },
})
