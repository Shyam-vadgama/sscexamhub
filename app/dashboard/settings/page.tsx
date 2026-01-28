'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  Database, 
  CreditCard,
  Key,
  Users,
  Server,
  Send,
  Trash,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Settings {
  app: {
    name: string
    url: string
    supportEmail: string
    contactPhone: string
  }
  payment: {
    razorpayKeyId: string
    razorpayKeySecret: string
    currency: string
    freePlanPrice: number
    proPlanPrice: number
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    senderName: string
    senderEmail: string
  }
  storage: {
    r2AccountId: string
    r2AccessKeyId: string
    r2SecretAccessKey: string
    r2BucketName: string
    r2PublicUrl: string
  }
  ai: {
    geminiApiKey: string
    model: string
    freeCreditLimit: number
    proCreditLimit: number
  }
}

export default function SettingsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    app: {
      name: 'SSC Exam Hub',
      url: 'https://sscexamhub.com',
      supportEmail: 'support@sscexamhub.com',
      contactPhone: '+91 1234567890',
    },
    payment: {
      razorpayKeyId: '',
      razorpayKeySecret: '',
      currency: 'INR',
      freePlanPrice: 0,
      proPlanPrice: 499,
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      senderName: 'SSC Exam Hub',
      senderEmail: '',
    },
    storage: {
      r2AccountId: '',
      r2AccessKeyId: '',
      r2SecretAccessKey: '',
      r2BucketName: 'ssc-exam-content',
      r2PublicUrl: '',
    },
    ai: {
      geminiApiKey: '',
      model: 'gemini-pro',
      freeCreditLimit: 3,
      proCreditLimit: 50,
    },
  })

  // Admin Management State
  const [admins, setAdmins] = useState<any[]>([])
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) {
        console.error('Error fetching settings:', error)
        // Fallback to localStorage if table doesn't exist or error occurs
        const storedSettings = localStorage.getItem('adminSettings')
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings))
        }
        return
      }

      if (data && data.length > 0) {
        setSettings(prevSettings => {
          const newSettings = { ...prevSettings }
          data.forEach(item => {
            if (item.key in newSettings) {
              // @ts-ignore
              newSettings[item.key] = item.value
            }
          })
          return newSettings
        })
      } else {
        // Try loading from localStorage if no DB settings found
        const storedSettings = localStorage.getItem('adminSettings')
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings))
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }, [supabase])

  const loadAdmins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('plan', 'admin')
      
      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Failed to load admins:', error)
      toast.error('Failed to load admin users')
    }
  }, [supabase])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins()
    }
  }, [activeTab, loadAdmins])

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return

    try {
      // Check if user exists
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', newAdminEmail)
        .single()

      if (searchError || !users) {
        toast.error('User not found. They must sign up first.')
        return
      }

      // Update user plan to admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ plan: 'admin' })
        .eq('id', users.id)

      if (updateError) throw updateError

      toast.success('Admin access granted successfully')
      setNewAdminEmail('')
      setShowAddAdmin(false)
      loadAdmins()
    } catch (error) {
      console.error('Failed to add admin:', error)
      toast.error('Failed to add admin')
    }
  }

  const removeAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove admin access for this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ plan: 'free' }) // or whatever default plan is
        .eq('id', adminId)

      if (error) throw error

      toast.success('Admin access removed')
      loadAdmins()
    } catch (error) {
      console.error('Failed to remove admin:', error)
      toast.error('Failed to remove admin')
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Save each section as a separate row
      const updates = Object.keys(settings).map(async (key) => {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key, 
            value: settings[key as keyof Settings],
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
      })

      await Promise.all(updates)
      
      // Also save to localStorage as backup
      localStorage.setItem('adminSettings', JSON.stringify(settings))
      
      toast.success('Settings saved successfully')
    } catch (error: any) {
      toast.error('Failed to save settings')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const testEmail = async () => {
    try {
      toast.success('Test email sent successfully (Demo mode)')
      // In production, call API to send test email
    } catch (error) {
      toast.error('Failed to send test email')
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'ai', label: 'AI Settings', icon: Key },
    { id: 'admins', label: 'Admin Users', icon: Users },
    { id: 'system', label: 'System', icon: Server },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your application settings
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Application Name</Label>
                <Input
                  value={settings.app.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    app: { ...settings.app, name: e.target.value }
                  })}
                  placeholder="SSC Exam Hub"
                />
              </div>

              <div>
                <Label>Application URL</Label>
                <Input
                  type="url"
                  value={settings.app.url}
                  onChange={(e) => setSettings({
                    ...settings,
                    app: { ...settings.app, url: e.target.value }
                  })}
                  placeholder="https://sscexamhub.com"
                />
              </div>

              <div>
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.app.supportEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    app: { ...settings.app, supportEmail: e.target.value }
                  })}
                  placeholder="support@sscexamhub.com"
                />
              </div>

              <div>
                <Label>Contact Phone</Label>
                <Input
                  type="tel"
                  value={settings.app.contactPhone}
                  onChange={(e) => setSettings({
                    ...settings,
                    app: { ...settings.app, contactPhone: e.target.value }
                  })}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Keep your API keys secure. Never share them publicly.
                </p>
              </div>

              <div>
                <Label>Razorpay Key ID</Label>
                <Input
                  type="password"
                  value={settings.payment.razorpayKeyId}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, razorpayKeyId: e.target.value }
                  })}
                  placeholder="rzp_test_xxxxx"
                />
              </div>

              <div>
                <Label>Razorpay Key Secret</Label>
                <Input
                  type="password"
                  value={settings.payment.razorpayKeySecret}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, razorpayKeySecret: e.target.value }
                  })}
                  placeholder="xxxxxxxxxxxxx"
                />
              </div>

              <div>
                <Label>Currency</Label>
                <Input
                  value={settings.payment.currency}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment: { ...settings.payment, currency: e.target.value }
                  })}
                  placeholder="INR"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Free Plan Price</Label>
                  <Input
                    type="number"
                    value={settings.payment.freePlanPrice}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, freePlanPrice: parseInt(e.target.value) }
                    })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Pro Plan Price</Label>
                  <Input
                    type="number"
                    value={settings.payment.proPlanPrice}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment: { ...settings.payment, proPlanPrice: parseInt(e.target.value) }
                    })}
                    placeholder="499"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings.email.smtpHost}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpHost: e.target.value }
                    })}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                    })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <Label>SMTP Username</Label>
                <Input
                  type="email"
                  value={settings.email.smtpUser}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpUser: e.target.value }
                  })}
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <Label>SMTP Password</Label>
                <Input
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpPassword: e.target.value }
                  })}
                  placeholder="App Password"
                />
              </div>

              <div>
                <Label>Sender Name</Label>
                <Input
                  value={settings.email.senderName}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, senderName: e.target.value }
                  })}
                  placeholder="SSC Exam Hub"
                />
              </div>

              <div>
                <Label>Sender Email</Label>
                <Input
                  type="email"
                  value={settings.email.senderEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, senderEmail: e.target.value }
                  })}
                  placeholder="noreply@sscexamhub.com"
                />
              </div>

              <Button onClick={testEmail}>
                <Send className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Configure Cloudflare R2 storage for file uploads and content delivery.
                </p>
              </div>

              <div>
                <Label>R2 Account ID</Label>
                <Input
                  value={settings.storage.r2AccountId}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, r2AccountId: e.target.value }
                  })}
                  placeholder="Your Cloudflare Account ID"
                />
              </div>

              <div>
                <Label>R2 Access Key ID</Label>
                <Input
                  type="password"
                  value={settings.storage.r2AccessKeyId}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, r2AccessKeyId: e.target.value }
                  })}
                  placeholder="Access Key ID"
                />
              </div>

              <div>
                <Label>R2 Secret Access Key</Label>
                <Input
                  type="password"
                  value={settings.storage.r2SecretAccessKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, r2SecretAccessKey: e.target.value }
                  })}
                  placeholder="Secret Access Key"
                />
              </div>

              <div>
                <Label>R2 Bucket Name</Label>
                <Input
                  value={settings.storage.r2BucketName}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, r2BucketName: e.target.value }
                  })}
                  placeholder="ssc-exam-content"
                />
              </div>

              <div>
                <Label>R2 Public URL</Label>
                <Input
                  type="url"
                  value={settings.storage.r2PublicUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, r2PublicUrl: e.target.value }
                  })}
                  placeholder="https://your-bucket.r2.dev"
                />
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Gemini API Key</Label>
                <Input
                  type="password"
                  value={settings.ai.geminiApiKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai: { ...settings.ai, geminiApiKey: e.target.value }
                  })}
                  placeholder="AIzaSy..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a>
                </p>
              </div>

              <div>
                <Label>AI Model</Label>
                <select
                  value={settings.ai.model}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai: { ...settings.ai, model: e.target.value }
                  })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Free User Credit Limit</Label>
                  <Input
                    type="number"
                    value={settings.ai.freeCreditLimit}
                    onChange={(e) => setSettings({
                      ...settings,
                      ai: { ...settings.ai, freeCreditLimit: parseInt(e.target.value) }
                    })}
                    placeholder="3"
                  />
                </div>

                <div>
                  <Label>Pro User Credit Limit</Label>
                  <Input
                    type="number"
                    value={settings.ai.proCreditLimit}
                    onChange={(e) => setSettings({
                      ...settings,
                      ai: { ...settings.ai, proCreditLimit: parseInt(e.target.value) }
                    })}
                    placeholder="50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin Users */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin Users</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage users with admin access</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {showAddAdmin ? (
                    <div className="flex gap-2 w-full">
                      <Input 
                        placeholder="User Email" 
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="min-w-[200px]"
                      />
                      <Button onClick={handleAddAdmin}>Add</Button>
                      <Button variant="ghost" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button onClick={() => setShowAddAdmin(true)} className="w-full sm:w-auto">
                      <Users className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {admin.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => removeAdmin(admin.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No admin users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Application and server details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Environment</span>
                      <span className="font-medium">Development</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Node Version</span>
                      <span className="font-medium">v18.0.0</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Database Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>System maintenance operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                      <Trash className="w-4 h-4 mr-2" />
                      Clear All Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}