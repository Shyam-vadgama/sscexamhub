'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { formatDateTime } from '@/lib/utils'
import { Shield, MapPin, Clock, Monitor, Activity } from 'lucide-react'

interface LoginLog {
  id: string
  user_id: string
  ip_address: string
  location: any
  user_agent: string
  login_time: string
  users?: {
    email: string
  }
}

export function LoginLogs() {
  const supabase = createClient()
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCount, setActiveCount] = useState(0)

  const loadLogs = useCallback(async () => {
    try {
      // Fetch logs
      const { data, error } = await supabase
        .from('admin_login_logs')
        .select(`
          *,
          users (
            email
          )
        `)
        .order('login_time', { ascending: false })
        .limit(10)

      if (error) throw error

      setLogs(data || [])

      // Calculate active users (unique users in last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: activeData } = await supabase
        .from('admin_login_logs')
        .select('user_id')
        .gte('login_time', oneDayAgo)

      if (activeData) {
        const uniqueUsers = new Set(activeData.map(l => l.user_id))
        setActiveCount(uniqueUsers.size)
      }

    } catch (error) {
      console.error('Error loading login logs:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Admin Logins</h3>
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {activeCount} Active Admin{activeCount !== 1 ? 's' : ''} (24h)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {log.users?.email || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Monitor className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 font-mono">{log.ip_address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {log.location?.city ? `${log.location.city}, ${log.location.country_name}` : 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {formatDateTime(log.login_time)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No login logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
