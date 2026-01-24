'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { 
  Users, 
  FileText, 
  BookOpen, 
  TrendingUp,
  Activity,
  DollarSign,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UserGrowthChart } from '@/components/dashboard/user-growth-chart'

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalQuestions: 0,
    activeUsers: 0,
    revenue: 0,
    growth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get test count
      const { count: testCount } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })

      // Get question count
      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: activeCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_date', sevenDaysAgo.toISOString())

      setStats({
        totalUsers: userCount || 0,
        totalTests: testCount || 0,
        totalQuestions: questionCount || 0,
        activeUsers: activeCount || 0,
        revenue: 0, // TODO: Calculate from payments
        growth: 12.5, // TODO: Calculate actual growth
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your SSC Exam Hub platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={`+${stats.growth}%`}
          trendUp={true}
          loading={loading}
        />
        <StatsCard
          title="Active Users (7d)"
          value={stats.activeUsers.toLocaleString()}
          icon={Activity}
          trend="+8.2%"
          trendUp={true}
          loading={loading}
        />
        <StatsCard
          title="Total Tests"
          value={stats.totalTests.toLocaleString()}
          icon={FileText}
          loading={loading}
        />
        <StatsCard
          title="Total Questions"
          value={stats.totalQuestions.toLocaleString()}
          icon={BookOpen}
          loading={loading}
        />
        <StatsCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          trend="+15.3%"
          trendUp={true}
          loading={loading}
        />
        <StatsCard
          title="Growth Rate"
          value={`${stats.growth}%`}
          icon={TrendingUp}
          trend="This month"
          loading={loading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart />
        <RecentActivity />
      </div>
    </div>
  )
}
