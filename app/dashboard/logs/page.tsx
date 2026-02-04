'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface Log {
  id: string
  action: string
  table_name: string | null
  record_id: string | null
  details: any
  user_id: string
  created_at: string
  user_email?: string
}

function LogsPageContent() {
  const supabase = createClient()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (searchQuery) {
        query = query.ilike('action', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Ideally we would join with users table to get email, but let's just show ID for now 
      // or fetch user details separately if needed.
      // For this implementation, we will stick to the log data.
      
      setLogs(data || [])
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, page, searchQuery])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View administrative actions and system events.
          </p>
        </div>
        <Button variant="outline" onClick={loadLogs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search actions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A list of recent system actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.table_name || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.user_id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading logs...</div>}>
      <LogsPageContent />
    </Suspense>
  )
}
