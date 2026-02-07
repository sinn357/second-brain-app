import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryProvider } from '@/src/providers/query-provider'

export default function RootLayout() {
  return (
    <QueryProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#f8fafc',
          contentStyle: { backgroundColor: '#0b1120' },
        }}
      />
    </QueryProvider>
  )
}
