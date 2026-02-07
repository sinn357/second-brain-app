import { Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useCreateNote } from '@/src/features/notes/use-notes'

export default function NewNoteScreen() {
  const router = useRouter()
  const createMutation = useCreateNote()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('입력 필요', '제목을 입력하세요.')
      return
    }

    try {
      const note = await createMutation.mutateAsync({
        title: title.trim(),
        body,
        folderId: null,
      })
      router.replace(`/notes/${note.id}`)
    } catch (createError) {
      Alert.alert(
        '생성 실패',
        createError instanceof Error ? createError.message : '알 수 없는 오류'
      )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '새 노트' }} />
      <View style={styles.content}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
          placeholder="새 노트 제목"
          placeholderTextColor="#64748b"
        />
        <Text style={styles.label}>본문</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          style={styles.bodyInput}
          placeholder="내용을 입력하세요"
          placeholderTextColor="#64748b"
          textAlignVertical="top"
        />
        <Pressable style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>생성</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    fontSize: 17,
    fontWeight: '700',
  },
  bodyInput: {
    minHeight: 260,
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
  createButton: {
    marginTop: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#eef2ff',
    fontWeight: '700',
  },
})
