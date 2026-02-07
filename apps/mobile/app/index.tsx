import { useMemo } from 'react'
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native'
import { useNotes } from '@/src/features/notes/use-notes'
import { Link } from 'expo-router'

export default function HomeScreen() {
  const { data, isLoading, error } = useNotes()

  const notes = useMemo(() => data ?? [], [data])

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nexus Mobile</Text>
      <Text style={styles.subtitle}>웹 API를 재사용한 Notes 목록</Text>
      <Link href="/notes/new" asChild>
        <Pressable style={styles.createButton}>
          <Text style={styles.createButtonText}>새 노트</Text>
        </Pressable>
      </Link>

      {isLoading && <ActivityIndicator size="large" color="#818cf8" />}
      {error && <Text style={styles.error}>{error.message}</Text>}

      {!isLoading && !error && (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={`/notes/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.title || 'Untitled'}</Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.body || '(empty)'}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  error: {
    color: '#fda4af',
    marginVertical: 10,
  },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#eef2ff',
    fontWeight: '700',
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 19,
  },
})
