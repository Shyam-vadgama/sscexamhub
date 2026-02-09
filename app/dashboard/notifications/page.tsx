'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, Send, History, Trash, Info, AlertTriangle, Megaphone, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  target_audience: string
  created_at: string
}

function NotificationsPageContent() {
  const supabase = createClient()
  const [history, setHistory] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all'
  })

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.message) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('app_notifications')
        .insert(formData)

      if (error) throw error

      toast.success('Notification sent to users!')
      setFormData({ title: '', message: '', type: 'info', target_audience: 'all' })
      loadHistory()
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const deleteHistory = async (id: string) => {
    try {
      await supabase.from('app_notifications').delete().eq('id', id)
      loadHistory()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'promo': return <Megaphone className="w-4 h-4 text-purple-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>Alert users about new tests, updates, or offers.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="Short catchy title" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea 
                    placeholder="Detailed message for users..." 
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="info">Info</option>
                      <option value="alert">Alert</option>
                      <option value="promo">Promotion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                      value={formData.target_audience}
                      onChange={e => setFormData({...formData, target_audience: e.target.value})}
                    >
                      <option value="all">All Users</option>
                      <option value="free">Free Only</option>
                      <option value="pro">Pro Only</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full" type="submit" disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Broadcast Now
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sent History</CardTitle>
                <CardDescription>Recently broadcasted messages.</CardDescription>
              </div>
              <History className="w-5 h-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center py-10 text-gray-500">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-center py-10 text-gray-500">No notifications sent yet.</p>
                ) : (
                  history.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="mt-1">{getTypeIcon(notif.type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                          <span className="text-[10px] uppercase text-gray-400 font-medium tracking-wider">
                            {formatDate(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            To: {notif.target_audience}
                          </Badge>
                        </div>
                      </div>
                      <button onClick={() => deleteHistory(notif.id)} className="text-gray-300 hover:text-red-500">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotificationsPageContent />
    </Suspense>
  )
}
