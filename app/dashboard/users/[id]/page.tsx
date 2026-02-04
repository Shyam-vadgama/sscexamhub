'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, Calendar, Award, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string
  plan: string
  exam_type: string | null
  coins: number
  streak_days: number
  created_at: string
  last_active_date: string | null
}

interface PerformanceSummary {
  total_completed: number
  total_tests: number
  average_score: number
  average_accuracy: number
  best_score: number
  best_test_name: string
  total_questions_answered: number
  total_correct_answers: number
  total_wrong_answers: number
  total_time_spent_minutes: number
  first_test_date: string
  last_test_date: string
}

interface SubjectPerformance {
  subject: string
  questions_attempted: number
  correct_answers: number
  wrong_answers: number
  skipped: number
  accuracy: number
  avg_time_per_question: number
}

interface TestAttempt {
  id: string
  test: { title: string }
  score: number
  accuracy: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  duration_seconds: number
  completed_at: string
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null)
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([])
  const [recentTests, setRecentTests] = useState<TestAttempt[]>([])

  const loadUserData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Basic User Info
      const userReq = supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single()

      // 2. Fetch Performance Summary
      const perfReq = supabase
        .from('user_performance_summary')
        .select('*')
        .eq('user_id', params.id)
        .single()

      // 3. Fetch Subject Performance
      const subjReq = supabase
        .from('user_subject_performance')
        .select('*')
        .eq('user_id', params.id)

      // 4. Fetch Recent Tests
      const testsReq = supabase
        .from('test_attempts')
        .select(`
          id,
          score,
          accuracy,
          total_questions,
          correct_answers,
          wrong_answers,
          duration_seconds,
          completed_at,
          test:tests(title)
        `)
        .eq('user_id', params.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)

      const [userRes, perfRes, subjRes, testsRes] = await Promise.all([
        userReq,
        perfReq,
        subjReq,
        testsReq
      ])

      if (userRes.error) throw userRes.error
      setUser(userRes.data)

      // Performance summary might be null if no tests taken
      if (!perfRes.error && perfRes.data) {
        setPerformance(perfRes.data)
      }

      if (!subjRes.error && subjRes.data) {
        setSubjects(subjRes.data)
      }

      if (!testsRes.error && testsRes.data) {
        // Transform the data to match the interface
        const transformedTests = testsRes.data.map((item: any) => ({
            ...item,
            test: Array.isArray(item.test) ? item.test[0] : item.test
        }))
        setRecentTests(transformedTests)
      }

    } catch (error: any) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">User not found</h2>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown User'}</h1>
          <p className="text-gray-500 text-sm">User ID: {user.id}</p>
        </div>
      </div>

      {/* Top Section: Profile & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user.phone}</span>
            </div>
            {user.email && (
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Joined: {formatDate(user.created_at)}</span>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.plan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.plan.toUpperCase()}
              </span>
              <div className="flex items-center space-x-1 text-yellow-600">
                <span className="font-bold">{user.coins}</span>
                <span className="text-xs">Coins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {performance ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium uppercase">Tests Taken</p>
                  <p className="text-2xl font-bold text-blue-900">{performance.total_completed}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-600 font-medium uppercase">Avg Score</p>
                  <p className="text-2xl font-bold text-green-900">{Math.round(performance.average_score)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium uppercase">Accuracy</p>
                  <p className="text-2xl font-bold text-purple-900">{Math.round(performance.average_accuracy)}%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium uppercase">Time Spent</p>
                  <p className="text-2xl font-bold text-orange-900">{Math.round(performance.total_time_spent_minutes)}m</p>
                </div>
                
                <div className="col-span-2 sm:col-span-4 mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                   <div>
                      <p className="text-sm text-gray-500">Correct</p>
                      <p className="text-lg font-semibold text-green-600">{performance.total_correct_answers}</p>
                   </div>
                   <div>
                      <p className="text-sm text-gray-500">Wrong</p>
                      <p className="text-lg font-semibold text-red-600">{performance.total_wrong_answers}</p>
                   </div>
                   <div>
                      <p className="text-sm text-gray-500">Total Qs</p>
                      <p className="text-lg font-semibold text-gray-600">{performance.total_questions_answered}</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No test data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Subject Performance */}
      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'accuracy') return [`${value}%`, 'Accuracy']
                    return [value, name.replace('_', ' ')]
                  }}
                  labelStyle={{ color: '#111827' }}
                  contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="correct_answers" name="Correct" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wrong_answers" name="Wrong" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section: Recent Test History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {recentTests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent tests found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-3 font-medium">Test Name</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Accuracy</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTests.map((test) => (
                    <tr key={test.id}>
                      <td className="py-3 font-medium text-gray-900">
                        {test.test?.title || 'Unknown Test'}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(test.completed_at)}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold">{test.score}</span>
                        <span className="text-gray-400 text-xs ml-1">
                          / {test.total_questions * 2} {/* Assuming 2 marks per Q, or use another metric if available */}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          test.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                          test.accuracy >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {test.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-500">
                        {Math.floor(test.duration_seconds / 60)}m {test.duration_seconds % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
