import { useQuery } from '@tanstack/react-query'

interface DashboardTotals {
  notes: number
  folders: number
  tags: number
  links: number
}

interface RecentActivity {
  date: string
  created: number
  updated: number
}

interface TopConnectedNote {
  id: string
  title: string
  totalLinks: number
}

interface FolderDistribution {
  id: string
  name: string
  count: number
}

interface DashboardData {
  totals: DashboardTotals
  recentActivity: RecentActivity[]
  topConnectedNotes: TopConnectedNote[]
  folderDistribution: FolderDistribution[]
}

// Dashboard 데이터 조회
export function useDashboard() {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      return data.dashboard
    },
  })
}
