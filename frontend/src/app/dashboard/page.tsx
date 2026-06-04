'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { StudyRecord, Category } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Clock, TrendingUp, Flame, Plus } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

type Period = 'thisMonth' | 'lastMonth' | 'last3Months' | 'all'

const periodLabels: Record<Period, string> = {
  thisMonth: '今月',
  lastMonth: '先月',
  last3Months: '過去3ヶ月',
  all: '全期間',
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('thisMonth')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: recordsData } = await supabase
        .from('study_records')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('study_date', { ascending: false })

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      setRecords(recordsData || [])
      setCategories(categoriesData || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  // 期間でフィルタリング
  const getFilteredRecords = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    if (period === 'all') return records

    if (period === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
      return records.filter(r => r.study_date >= firstDay)
    }

    if (period === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString().split('T')[0]
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString().split('T')[0]
      return records.filter(r => r.study_date >= firstDay && r.study_date <= lastDay)
    }

    if (period === 'last3Months') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        .toISOString().split('T')[0]
      return records.filter(r => r.study_date >= firstDay)
    }

    return records
  }

  const filteredRecords = getFilteredRecords()

  // 合計時間
  const totalMinutes = filteredRecords.reduce((sum, r) => sum + r.duration_minutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  // 今日の合計時間
  const today = new Date().toISOString().split('T')[0]
  const todayMinutes = records
    .filter(r => r.study_date === today)
    .reduce((sum, r) => sum + r.duration_minutes, 0)

  // カテゴリー別集計
  const categoryStats = categories.map(cat => {
    const mins = filteredRecords
      .filter(r => r.category_id === cat.id)
      .reduce((sum, r) => sum + r.duration_minutes, 0)
    return {
      name: cat.name,
      minutes: mins,
      hours: Math.round(mins / 60 * 10) / 10,
      color: cat.color,
    }
  }).filter(c => c.minutes > 0).sort((a, b) => b.minutes - a.minutes)

  const recentRecords = filteredRecords.slice(0, 5)

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">ダッシュボード</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link
            href="/records/new"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            記録を追加
          </Link>
        </div>

        {/* 期間切り替えタブ */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium',
                period === p
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">{periodLabels[period]}の合計</span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {totalHours}<span className="text-sm font-normal text-gray-400">h </span>
              {totalMins}<span className="text-sm font-normal text-gray-400">m</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">今日の学習</span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {Math.floor(todayMinutes / 60)}<span className="text-sm font-normal text-gray-400">h </span>
              {todayMinutes % 60}<span className="text-sm font-normal text-gray-400">m</span>
            </div>
          </div>

          <div className="card col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs text-gray-400">{periodLabels[period]}の記録数</span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {filteredRecords.length}<span className="text-sm font-normal text-gray-400"> 件</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* 円グラフ */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">カテゴリー別</h2>
            {categoryStats.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                まだ記録がありません
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="minutes"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const minutes = typeof value === 'number' ? value : 0
                      return [`${Math.floor(minutes / 60)}h ${minutes % 60}m`, '学習時間']
                    }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #F3F4F6',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 最近の記録 */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {periodLabels[period]}の記録
            </h2>
            {recentRecords.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                まだ記録がありません
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: record.categories?.color || '#6366F1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {record.content || '（メモなし）'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {record.categories?.name || 'カテゴリーなし'}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {record.duration_minutes}分
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}