'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, CheckCircle, XCircle, MessageSquare, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Report {
  id: string
  user_id: string
  type: string
  target_id: string | null
  message: string
  status: 'pending' | 'investigating' | 'resolved' | 'ignored'
  admin_note: string | null
  created_at: string
}

function ReportsPageContent() {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  
  // Resolution Dialog State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setReports(data || [])
    } catch (error: any) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [supabase, statusFilter])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return

    try {
      const { error } = await supabase
        .from('user_reports')
        .update({ status, admin_note: adminNote })
        .eq('id', selectedReport.id)

      if (error) throw error

      toast.success(`Report marked as ${status}`)
      setDialogOpen(false)
      loadReports()
    } catch (error) {
      toast.error('Failed to update report')
    }
  }

  const openResolutionDialog = (report: Report) => {
    setSelectedReport(report)
    setAdminNote(report.admin_note || '')
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge variant="success">Resolved</Badge>
      case 'investigating': return <Badge variant="warning">Investigating</Badge>
      case 'ignored': return <Badge variant="secondary">Ignored</Badge>
      default: return <Badge variant="destructive">Pending</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question_error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'bug': return <XCircle className="w-4 h-4 text-orange-500" />
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
          <p className="text-gray-600 mt-1">Review feedback and content errors reported by users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
        <Button variant="outline" onClick={loadReports}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-10 text-gray-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">All caught up!</p>
            <p className="text-gray-500">No reports found with this status.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(report.type)}
                  <span className="font-semibold capitalize text-gray-900">
                    {report.type.replace('_', ' ')}
                  </span>
                  {getStatusBadge(report.status)}
                </div>
                <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
              </div>

              <p className="text-gray-700 mt-2 mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                "{report.message}"
              </p>

              {report.admin_note && (
                <p className="text-sm text-gray-500 mb-4 italic">
                  Admin Note: {report.admin_note}
                </p>
              )}

              <div className="flex items-center gap-3 border-t pt-4">
                <div className="text-xs text-gray-400 font-mono">User ID: {report.user_id}</div>
                <div className="flex-1"></div>
                
                {report.target_id && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View Target
                  </Button>
                )}
                
                <Button size="sm" onClick={() => openResolutionDialog(report)}>
                  Update Status
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Report Status</DialogTitle>
            <DialogDescription>
              Add a note and change the status of this report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Admin Note</label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Fixed the typo in question #42"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => handleUpdateStatus('ignored')}>
              Mark as Ignored
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleUpdateStatus('investigating')}>
                Investigating
              </Button>
              <Button onClick={() => handleUpdateStatus('resolved')} className="bg-green-600 hover:bg-green-700 text-white">
                Mark Resolved
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsPageContent />
    </Suspense>
  )
}
