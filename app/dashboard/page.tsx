'use client'

import { useDashboard } from '@/lib/hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { FileText, Folder, Tag, Link as LinkIcon, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <Skeleton className="h-12 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
        <div className="bg-white dark:bg-indigo-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="dark:text-indigo-100">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const { totals, recentActivity, topConnectedNotes, folderDistribution } = dashboard

  return (
    <div className="min-h-screen bg-indigo-50 dark:bg-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">Dashboard</h1>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            통계 및 분석 대시보드
          </p>
        </div>

        {/* 총 개수 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Total Notes
              </CardTitle>
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{totals.notes}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Folders
              </CardTitle>
              <Folder className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{totals.folders}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Tags
              </CardTitle>
              <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{totals.tags}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Links
              </CardTitle>
              <LinkIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{totals.links}</div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 7일 활동 그래프 */}
        <Card className="dark:bg-indigo-900 dark:border-indigo-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <TrendingUp className="h-5 w-5" />
              Recent Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentActivity}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#6366F1"
                />
                <YAxis stroke="#6366F1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#312e81',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#e0e7ff',
                  }}
                />
                <Legend />
                <Bar dataKey="created" fill="#4F46E5" name="Created" />
                <Bar dataKey="updated" fill="#10B981" name="Updated" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 10 연결된 노트 */}
          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Top 10 Connected Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topConnectedNotes.length > 0 ? (
                  topConnectedNotes.map((note, idx) => (
                    <Link key={note.id} href={`/notes/${note.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            #{idx + 1}
                          </span>
                          <span className="text-sm text-indigo-900 dark:text-indigo-100 truncate max-w-xs">
                            {note.title}
                          </span>
                        </div>
                        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                          {note.totalLinks} links
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No connected notes yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 폴더별 분포 파이 차트 */}
          <Card className="dark:bg-indigo-900 dark:border-indigo-700">
            <CardHeader>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Notes by Folder</CardTitle>
            </CardHeader>
            <CardContent>
              {folderDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={folderDistribution as any}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry: any) => `${entry.name} (${entry.count})`}
                    >
                      {folderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#312e81',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#e0e7ff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No folders yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
